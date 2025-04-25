import db from "@/db"
import { patient, profile, role, sample, user } from "@/db/schema"
import { getUser } from "@/lib/auth"
import { eq } from "drizzle-orm"

export async function getUserById(id: string) {
  return await db.select().from(user).where(eq(user.id, id)).limit(1)
}


export async function getPatients() {
  return await db.select().from(patient)
}

export async function getPatientById(id: string) {
  return await db.select().from(patient).where(eq(patient.id, id)).limit(1)
}

export async function getSamplesByPatientId(id: string) {
  return await db.select().from(sample).where(eq(sample.patientId, id))
}

export async function getSampleById(id: string) {
  return await db.select().from(sample).where(eq(sample.id, id)).limit(1)
}

export async function getSamples() {
  return await db.select().from(sample)
}

export async function getProfileByUserId(userId: string) {
  return await db.select().from(profile).where(eq(profile.userId, userId)).limit(1)
}

export async function getRoleById(id: string) {
  return await db.select().from(role).where(eq(role.id, id)).limit(1)
}