import { patient, profile, role, sample, user } from "@/db/schema"
import { eq } from "drizzle-orm"
import { db } from "..";

export async function getUserById(id: string) {
  const result = await db.select().from(user).where(eq(user.id, id));
  return result[0];
}


export async function getAllPatients() {
  return await db.select().from(patient);
}

export async function getPatientById(id: string) {
  const result = await db.select().from(patient).where(eq(patient.id, id));
  return result[0];
}

export async function getSamplesByPatientId(id: string) {
  return await db.select().from(sample).where(eq(sample.patientId, id));
}

export async function getSampleById(id: string) {
  const result = await db.select().from(sample).where(eq(sample.id, id));
  return result[0];
}

export async function getAllSamples() {
  return await db.select().from(sample)
}

export async function getProfileByUserId(userId: string) {
  const result = await db.select().from(profile).where(eq(profile.userId, userId));
  return result[0];
}

export async function getRoleById(id: string) {
  const result = await db.select().from(role).where(eq(role.id, id));
  return result[0];
}