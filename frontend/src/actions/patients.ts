'use server'

import { db } from "@/db"
import { patient } from "@/db/schema"
import { eq } from "drizzle-orm"

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
}) {
  await db.update(patient)
    .set(data)
    .where(eq(patient.id, id))
}

export async function deletePatient(patientId: string) {
  try {
    await db.delete(patient).where(eq(patient.id, patientId))
    return { success: true }
  } catch (error) {
    console.error("Failed to delete patient:", error)
    return { success: false, error: "Something went wrong." }
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
}) {
  await db.insert(patient).values({
    ...data,
    createdAt: new Date(),
  });
}
