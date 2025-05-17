'use server'

import { db } from "@/db"
import { patient } from "@/db/schema"
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Key");
}
const supabase = createClient(supabaseUrl, supabaseKey);

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
  let imageUrl: string | undefined;

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

      imageUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${uploadData.path}`;
    } catch (error) {
      console.error("Error uploading file:", error);
      return { success: false, error: "Failed to upload image" };
    }
  }

  const updateData = { ...data };
  delete updateData.file;
  if (imageUrl) {
    Object.assign(updateData, { imageUrl });
  }

  try {
    await db.update(patient)
      .set(updateData)
      .where(eq(patient.id, id));
    return { success: true };
  } catch (error) {
    console.error("Failed to update patient:", error);
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
  let imageUrl: string | undefined;

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

      imageUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${uploadData.path}`;
    } catch (error) {
      console.error("Error uploading file:", error);
      return { success: false, error: "Failed to upload image" };
    }
  }

  const insertData = { ...data };
  delete insertData.file;
  if (imageUrl) {
    Object.assign(insertData, { imageUrl });
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

