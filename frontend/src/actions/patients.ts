'use server'

import { db } from "@/db"
import { patient, image, doctorPatient, organizationPatient } from "@/db/schema"
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Key");
}

// starte of timeoutt to fix database  timeout retrieval error

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

//  handles database timeouts
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error('Database operation timed out')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

// end of timeout

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

    // get the current patient data to check for existing image
    const currentPatient = await withTimeout(
      db.select().from(patient).where(eq(patient.id, id)).limit(1),
      DB_TIMEOUT
    );
    
    if (currentPatient.length === 0) {
      return { success: false, error: "Patient not found" };
    }

    if (data.file) {
      try {

        // upload new image
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
        
        // create new image record
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
    console.log("Starting patient deletion process for ID:", patientId);
    
    const patientData = await withTimeout(
      db.select().from(patient).where(eq(patient.id, patientId)).limit(1),
      DB_TIMEOUT
    );

    if (patientData.length === 0) {
      console.log("Patient not found with ID:", patientId);
      return { success: false, error: "Patient not found" };
    }

    console.log("Found patient data:", patientData[0]);

    const imageId = patientData[0].imageId;
    const imageUrl = imageId ? (await withTimeout(
      db.select().from(image).where(eq(image.id, imageId)).limit(1),
      DB_TIMEOUT
    ))[0]?.imageUrl : null;

    // delete the patient first due to foreign key constraint
    console.log("Attempting to delete patient record");
    try {
      await withTimeout(
        db.delete(patient).where(eq(patient.id, patientId)),
        DB_TIMEOUT
      );
      console.log("Successfully deleted patient record");
    } catch (patientDeleteError) {
      console.error("Error deleting patient record:", patientDeleteError);
      throw new Error(`Failed to delete patient record: ${patientDeleteError}`);
    }

    // if patient has an image, delete it from storage and database
    if (imageId && imageUrl) {
      console.log("Patient had image ID:", imageId);
      
      const path = imageUrl.split('/storage/v1/object/public/avatars/')[1];
      console.log("Attempting to delete image from storage with path:", path);
      
      if (path) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([path]);

        if (deleteError) {
          console.error("Failed to delete image from storage:", deleteError);
          return { success: false, error: "Failed to delete image from storage" };
        }
        console.log("Successfully deleted image from storage");
      }

      // delete the image record last forgot why
      console.log("Attempting to delete image record from database");
      try {
        await withTimeout(
          db.delete(image).where(eq(image.id, imageId)),
          DB_TIMEOUT
        );
        console.log("Successfully deleted image record from database");
      } catch (imageDeleteError) {
        console.error("Error deleting image record:", imageDeleteError);
        throw new Error(`Failed to delete image record: ${imageDeleteError}`);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to delete patient:", error);
    if (error instanceof Error) {
      if (error.message === 'Database operation timed out') {
        return { success: false, error: "Operation timed out. Please try again." };
      }
      return { success: false, error: error.message };
    }
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
  createdBy: string;
  organizationId: string; // <-- Add organizationId
  doctorId?: string; // <-- Optional doctor assignment
}) {
  // Check if email already exists (only if email is provided and not empty)
  if (data.email && data.email.trim() !== "") {
    const existing = await db.select().from(patient).where(eq(patient.email, data.email.trim())).limit(1);
    if (existing.length > 0) {
      return { success: false, error: "Email already exists." };
    }
  }
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

  // Prepare insert data, converting empty strings to null for optional fields
  const insertData: any = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email && data.email.trim() !== "" ? data.email.trim() : null,
    contactNumber: data.contactNumber && data.contactNumber.trim() !== "" ? data.contactNumber.trim() : null,
    address: data.address && data.address.trim() !== "" ? data.address.trim() : null,
    height: data.height || null,
    weight: data.weight || null,
    sex: data.sex,
    bloodType: data.bloodType && data.bloodType.trim() !== "" ? data.bloodType.trim() : null,
    birthDate: data.birthDate && data.birthDate.trim() !== "" ? data.birthDate : null,
    createdAt: new Date(),
    createdBy: data.createdBy,
  };
  
  if (imageId) {
    insertData.imageId = imageId;
  }

  try {
    // Insert patient and organizationPatient in a transaction
    await db.transaction(async (tx) => {
      const [newPatient] = await tx.insert(patient).values(insertData).returning();

      // Link patient to organization
      await tx.insert(organizationPatient).values({
        patientId: newPatient.id,
        organizationId: data.organizationId,
        status: "Active",
      });

      // If doctorId is provided, assign doctor to patient
      if (data.doctorId) {
        await tx.insert(doctorPatient).values({
          doctorId: data.doctorId,
          patientId: newPatient.id,
        });
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error("Failed to add patient:", error);
    return { success: false, error: "Failed to add patient" };
  }
}

export async function setDoctorForPatient(patientId: string, doctorId: string) {
  // Remove any existing doctor-patient relationship for this patient
  await db.delete(doctorPatient).where(eq(doctorPatient.patientId, patientId));
  // Insert the new doctor-patient relationship (id is auto-generated)
  await db.insert(doctorPatient).values({
    doctorId,
    patientId
  });
  return { success: true };
}
