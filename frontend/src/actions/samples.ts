"use server";

import { db } from "@/db";
import { getProfileByUserId } from "@/db/queries/select";
import { image, profile, sample, sampleImage } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { createClient } from '@supabase/supabase-js';
import { eq, inArray } from "drizzle-orm";
import sizeOf from "image-size";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use the service role key for server-side operations
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Key");
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadFileAndInsertRecords(
  file: File, 
  sampleId: string, 
  profileId: string
) {
  try {
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate unique filename
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;
    
    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from("sample-images")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase Storage upload failed:", uploadError);
      throw new Error(`Failed to upload image ${file.name}: ${uploadError.message}`);
    }

    // Generate public URL
    const imageUrl = `${supabaseUrl}/storage/v1/object/public/sample-images/${data.path}`;
    
    // Get image dimensions
    const dimensions = sizeOf(buffer);

    // Insert image record
    const [imageRecord] = await db
      .insert(image)
      .values({
        id: crypto.randomUUID(),
        imageUrl,
      })
      .returning();

    // Link image to sample
    await db.insert(sampleImage).values({
      sampleId, // This should be the same for all files
      uploadedBy: profileId,
      metadata: dimensions,
      imageId: imageRecord.id,
    });


    return imageRecord.id;

  } catch (error) {
    console.error(`Error uploading file ${file.name}:`, error);
    throw error;
  }
}

/**
 * Ensures the sample-images bucket exists, creates it if it doesn't
 */
async function ensureSampleImagesBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'sample-images');
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket('sample-images', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 52428800, // 50MB
      });
      
      if (error) {
        console.error("Failed to create sample-images bucket:", error);
        throw new Error(`Failed to create storage bucket: ${error.message}`);
      }
      
      console.log("Created sample-images bucket successfully");
    }
  } catch (error) {
    console.error("Error ensuring sample-images bucket exists:", error);
    // Don't throw here, as the bucket might already exist
  }
}

/**
 * Uploads a sample (image) to Supabase Storage and saves its metadata to the database.
 *
 * @param patientId - The ID of the patient associated with the sample.
 * @param file - The file to upload (must be an image).
 * @returns An object with a success flag and the image URL, or throws an error.
 */
export async function uploadSampleAction(
  patientId: string,
  files: File[],
  sampleName: string,
  organizationId?: string
) {
  // Validate inputs
  if (!files?.length || !patientId || !sampleName.trim()) {
    throw new Error("Missing required fields: patientId, files, and sampleName are required.");
  }

  // Get current user and profile
  const currentUser = await getUser();
  const userProfile = await db
    .select({ id: profile.id })
    .from(profile)
    .where(eq(profile.userId, currentUser.id))
    .limit(1);

  if (!userProfile?.[0]) {
    throw new Error("User profile not found");
  }

  // Ensure storage bucket exists
  await ensureSampleImagesBucket();

  try {
    // Create ONE sample record
    const [sampleRecord] = await db
      .insert(sample)
      .values({
        patientId,
        sampleName: sampleName.trim(),
        createdBy: currentUser.id,
        organizationId: organizationId || crypto.randomUUID(),
      })
      .returning();


    // Process all files for this single sample
    const uploadPromises = files.map(file => 
      uploadFileAndInsertRecords(file, sampleRecord.id, userProfile[0].id)
    );
    
    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    return { 
      success: true, 
      sampleId: sampleRecord.id,
      filesUploaded: files.length 
    };

  } catch (error) {
    console.error("Error in uploadSampleAction:", error);
    throw error;
  }
}

export async function editSampleAction(sampleId: string, files: File[]) {
  const user = await getUser();
  const profile = await getProfileByUserId(user.id);
  const uploadPromises = files.map(file => 
    uploadFileAndInsertRecords(file, sampleId, profile.id)
  );
  
  // Wait for all uploads to complete
  await Promise.all(uploadPromises);

  return { 
    success: true, 
    sampleId: sampleId,
    filesUploaded: files.length 
  };
}

export async function deleteSample(sampleId: string) {
  try {
    // Get all sample_image data with their associated image URLs
    const sampleImageData = await db
      .select({
        sampleImageId: sampleImage.id,
        imageId: sampleImage.imageId,
        imageUrl: image.imageUrl,
      })
      .from(sampleImage)
      .leftJoin(image, eq(sampleImage.imageId, image.id))
      .where(eq(sampleImage.sampleId, sampleId));

    if (sampleImageData.length === 0) {
      return { success: false, error: "Sample not found" };
    }

    // Collect all storage paths to delete
    const storagePaths: string[] = [];
    const imageIds: string[] = [];

    for (const record of sampleImageData) {
      if (record.imageUrl) {
        // Check if the image comes from the sample-images bucket
        const bucketPath = record.imageUrl.split('/storage/v1/object/public/sample-images/')[1];
        if (bucketPath) {
          storagePaths.push(bucketPath);
        }
      }
      
      if (record.imageId) {
        imageIds.push(record.imageId);
      }
    }

    // Delete all images from storage (sample-images bucket)
    if (storagePaths.length > 0) {
      const { error: deleteStorageError } = await supabase.storage
        .from('sample-images')
        .remove(storagePaths);
      
      if (deleteStorageError) {
        console.error("Failed to delete images from storage:", deleteStorageError);
        return { success: false, error: "Failed to delete images from storage" };
      }
    }

    // Delete all sample_image records first
    await db.delete(sampleImage).where(eq(sampleImage.sampleId, sampleId));

    // Delete all image records second
    if (imageIds.length > 0) {
      await db.delete(image).where(inArray(image.id, imageIds));
    }

    // Finally, delete the sample record
    await db.delete(sample).where(eq(sample.id, sampleId));

    return { success: true };
  } catch (error) {
    console.error("Failed to delete sample:", error);
    return { success: false, error: "Something went wrong." };
  }
}

export async function deleteSampleImage(sampleImageId: string) {
  try {
    // Get the sample_image record and its linked image
    const sampleImageData = await db
      .select({
        imageId: sampleImage.imageId,
        imageUrl: image.imageUrl,
      })
      .from(sampleImage)
      .leftJoin(image, eq(sampleImage.imageId, image.id))
      .where(eq(sampleImage.id, sampleImageId));

    if (!sampleImageData.length) {
      return { success: false, error: "Sample image not found" };
    }

    const { imageId, imageUrl } = sampleImageData[0];

    // Delete the sample_image record
    await db.delete(sampleImage).where(eq(sampleImage.id, sampleImageId));

    // Delete the image record
    if (imageId) {
      await db.delete(image).where(eq(image.id, imageId));
    }

    // Delete the image from storage
    if (imageUrl) {
      const bucketPath = imageUrl.split('/storage/v1/object/public/sample-images/')[1];
      if (bucketPath) {
        const { error: deleteStorageError } = await supabase.storage
          .from('sample-images')
          .remove([bucketPath]);
        if (deleteStorageError) {
          console.error("Failed to delete image from storage:", deleteStorageError);
          return { success: false, error: "Failed to delete image from storage" };
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to delete sample image:", error);
    return { success: false, error: "Something went wrong." };
  }
}