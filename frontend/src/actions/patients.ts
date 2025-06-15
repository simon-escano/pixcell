'use server'

import { db } from "@/db"
import { patient, image } from "@/db/schema"
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Key");
}

// Add timeout configuration
const DB_TIMEOUT = 10000; // 10 seconds
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  },
  global: {
    headers: {
      'x-connection-timeout': DB_TIMEOUT.toString()
    }
  }
});

// Helper function to handle database timeouts
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error('Database operation timed out')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

export async function updatePatient(id: string, data: {
  firstName: string
  lastName: string
  email: string
  contactNumber: string
  address: string
  height: number
  weight: number
  sex: string
  bloodType: string
  birthDate: string
  file?: File | null
}) {
  try {
    let imageId: string | undefined;

    // First get the current patient data to check for existing image
    const currentPatient = await withTimeout(
      db.select().from(patient).where(eq(patient.id, id)).limit(1),
      DB_TIMEOUT
    );
    
    if (currentPatient.length === 0) {
      return { success: false, error: "Patient not found" };
    }

    if (data.file) {
      try {
        // If there's an existing image, delete it from storage and the database
        if (currentPatient[0].imageId) {
          const existingImage = await withTimeout(
            db.select().from(image).where(eq(image.id, currentPatient[0].imageId)).limit(1),
            DB_TIMEOUT
          );
          
          if (existingImage.length > 0 && existingImage[0].imageUrl) {
            const path = existingImage[0].imageUrl.split('/storage/v1/object/public/avatars/')[1];
            if (path) {
              await supabase.storage.from('avatars').remove([path]);
            }
            await withTimeout(
              db.delete(image).where(eq(image.id, currentPatient[0].imageId)),
              DB_TIMEOUT
            );
          }
        }

        // Upload new image
        const bytes = await data.file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `${Date.now()}-${data.file.name}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, buffer, {
            contentType: data.file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error("Supabase Storage upload failed:", uploadError);
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }

        const imageUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${uploadData.path}`;
        
        // Create new image record
        const [newImage] = await withTimeout(
          db.insert(image)
            .values({
              id: crypto.randomUUID(),
              imageUrl: imageUrl
            })
            .returning(),
          DB_TIMEOUT
        );

        imageId = newImage.id;
      } catch (error) {
        console.error("Error handling image:", error);
        return { success: false, error: "Failed to handle image" };
      }
    }

    const updateData = { ...data };
    delete updateData.file;
    if (imageId) {
      Object.assign(updateData, { imageId });
    }

    await withTimeout(
      db.update(patient)
        .set(updateData)
        .where(eq(patient.id, id)),
      DB_TIMEOUT
    );
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update patient:", error);
    if (error instanceof Error && error.message === 'Database operation timed out') {
      return { success: false, error: "Operation timed out. Please try again." };
    }
    return { success: false, error: "Failed to update patient data" };
  }
}

export async function deletePatient(patientId: string) {
  try {
    const patientData = await db.select().from(patient).where(eq(patient.id, patientId)).limit(1);
    if (patientData.length === 0) {
      return { success: false, error: "Patient not found" };
    }

    const imageUrl = patientData[0].imageUrl;
    if (imageUrl) {
      const path = imageUrl.split('/storage/v1/object/public/avatars/')[1];
      if (path) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([path]);

        if (deleteError) {
          console.error("Failed to delete image from storage:", deleteError);
          return { success: false, error: "Failed to delete image from storage" };
        }
      }
    }

    await db.delete(patient).where(eq(patient.id, patientId));
    return { success: true };
  } catch (error) {
    console.error("Failed to delete patient:", error);
    return { success: false, error: "Something went wrong." };
  }
}

export async function addPatient(data: {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  address: string;
  height: number;
  weight: number;
  sex: string;
  bloodType: string;
  birthDate: string;
  file?: File | null;
}) {
  let imageId: string | undefined;

  if (data.file) {
    try {
      const bytes = await data.file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${data.file.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, buffer, {
          contentType: data.file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase Storage upload failed:", uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      const imageUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${uploadData.path}`;
      
      // Create image record in the database
      const [newImage] = await db.insert(image)
        .values({
          id: crypto.randomUUID(),
          imageUrl: imageUrl
        })
        .returning();

      imageId = newImage.id;
    } catch (error) {
      console.error("Error uploading file:", error);
      return { success: false, error: "Failed to upload image" };
    }
  }

  const insertData = { ...data };
  delete insertData.file;
  if (imageId) {
    Object.assign(insertData, { imageId });
  }

  try {
    await db.insert(patient).values({
      ...insertData,
      createdAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to add patient:", error);
    return { success: false, error: "Failed to add patient" };
  }
}
