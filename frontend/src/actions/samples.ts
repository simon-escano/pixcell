"use server";

import { db } from "@/db";
import { sample } from "@/db/schema";
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
 * Uploads a sample (image) to Supabase Storage and saves its metadata to the database.
 *
 * @param patientId - The ID of the patient associated with the sample.
 * @param file - The file to upload (must be an image).
 * @returns An object with a success flag and the image URL, or throws an error.
 */
export async function uploadSampleAction(
  patientId: string,
  file: File,
  sampleName: string
) {
  const currentUser = await getUser();
  if (!file || !patientId || !sampleName.trim()) {
    throw new Error("Missing required fields: patientId, file, and sampleName are required.");
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${Date.now()}-${file.name}`;

    const { data, error: uploadError } = await supabase.storage
      .from('sample-images')
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

    try {
      await db.insert(sample).values({
        patientId,
        uploadedBy: currentUser?.id,
        metadata: dimensions,
        imageUrl,
        sampleName: sampleName.trim(),
      });
    } catch (dbError: any) {
      console.error("Database insert failed:", dbError);
      throw new Error(`Failed to save sample data: ${dbError.message}`);
    }

    return { success: true, imageUrl };
  } catch (error: any) {
    console.error("Error in uploadSampleAction:", error);
    throw new Error(`Sample upload failed: ${error.message}`);
  }
}

export async function deleteSample(sampleId: string) {
  try {
    const sampleData = await db.select().from(sample).where(eq(sample.id, sampleId)).limit(1);
    if (sampleData.length === 0) {
      return { success: false, error: "Sample not found" };
    }

    const imageUrl = sampleData[0].imageUrl;
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

    await db.delete(sample).where(eq(sample.id, sampleId));
    return { success: true };
  } catch (error) {
    console.error("Failed to delete sample:", error);
    return { success: false, error: "Something went wrong." };
  }
}