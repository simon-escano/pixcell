"use server";

import { db } from "@/db";
import { sample, sampleImage, image, profile } from "@/db/schema";
import sizeOf from "image-size";
import { getUser } from "@/lib/auth";
import { createClient } from '@supabase/supabase-js';
import { eq } from "drizzle-orm";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use the service role key for server-side operations
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Key");
}
const supabase = createClient(supabaseUrl, supabaseKey);

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
  sampleName: string
) {
  if (!files?.length || !patientId || !sampleName.trim()) {
    throw new Error("Missing required fields: patientId, file, and sampleName are required.");
  }

  const currentUser = await getUser();

  const userProfile = await db
    .select({ id: profile.id })
    .from(profile)
    .where(eq(profile.userId, currentUser.id))
    .limit(1);

  if (!userProfile?.[0]) {
    throw new Error("User profile not found");
  }

  const [sampleRecord] = await db
    .insert(sample)
    .values({
      patientId,
      sampleName: sampleName.trim(),
      createdBy: currentUser.id,
    })
    .returning();

  await ensureSampleImagesBucket();

  for (const file of files) {
    await uploadFileAndInsertRecords(file, sampleRecord.id, userProfile[0].id);
  }

  return { success: true };

  async function uploadFileAndInsertRecords(file: File, sampleId: string, profileId: string) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${Date.now()}-${file.name}`;

    const { data, error: uploadError } = await supabase.storage
      .from("sample-images")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase Storage upload failed:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const imageUrl = `${supabaseUrl}/storage/v1/object/public/sample-images/${data.path}`;
    const dimensions = sizeOf(buffer);

    const [imageRecord] = await db
      .insert(image)
      .values({
        id: crypto.randomUUID(),
        imageUrl,
      })
      .returning();

    await db.insert(sampleImage).values({
      sampleId,
      uploadedBy: profileId,
      metadata: dimensions,
      imageId: imageRecord.id,
    });
  }
}

export async function deleteSample(sampleId: string) {
  try {
    // Get sample_image data to find the image URL
    const sampleImageData = await db
      .select({
        imageUrl: image.imageUrl,
        imageId: sampleImage.imageId,
      })
      .from(sampleImage)
      .leftJoin(image, eq(sampleImage.imageId, image.id))
      .where(eq(sampleImage.sampleId, sampleId))
      .limit(1);

    if (sampleImageData.length === 0) {
      return { success: false, error: "Sample not found" };
    }

    const imageUrl = sampleImageData[0].imageUrl;
    if (imageUrl) {
      const path = imageUrl.split('/storage/v1/object/public/sample-images/')[1];
      if (path) {
        const { error: deleteError } = await supabase.storage
          .from('sample-images')
          .remove([path]);

        if (deleteError) {
          console.error("Failed to delete image from storage:", deleteError);
          return { success: false, error: "Failed to delete image from storage" };
        }
      }
    }

    // Delete from sample table (this will cascade to sample_image due to foreign key)
    await db.delete(sample).where(eq(sample.id, sampleId));
    return { success: true };
  } catch (error) {
    console.error("Failed to delete sample:", error);
    return { success: false, error: "Something went wrong." };
  }
}