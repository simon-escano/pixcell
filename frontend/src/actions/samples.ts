"use server";

import { db } from "@/db";
import { sample } from "@/db/schema";
import sizeOf from "image-size";
import { getUser } from "@/lib/auth";
import { createClient } from '@supabase/supabase-js';

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
  file: File
) {
  const currentUser = await getUser();
  if (!file || !patientId) {
    throw new Error("Missing required fields: patientId and file are required.");
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${Date.now()}-${file.name}`;

    // Upload to Supabase Storage
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

    // Construct the image URL
    const imageUrl = `${supabaseUrl}/storage/v1/object/public/sample-images/${data.path}`;
    const dimensions = sizeOf(buffer);

    // Insert sample data into the database
    try {
      await db.insert(sample).values({
        patientId,
        uploadedBy: currentUser?.id,
        metadata: dimensions,
        imageUrl,
      });
    } catch (dbError: any) {
      console.error("Database insert failed:", dbError);
      // Consider deleting the uploaded file from Supabase Storage here, if the database insert fails.
      throw new Error(`Failed to save sample data: ${dbError.message}`);
    }

    return { success: true, imageUrl };
  } catch (error: any) {
    //  Log the error for server-side debugging.
    console.error("Error in uploadSampleAction:", error);
    //  Wrap the error in a new Error object with a more informative message.  This preserves the original error's message.
    throw new Error(`Sample upload failed: ${error.message}`);
  }
}
