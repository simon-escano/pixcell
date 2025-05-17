import { patient, profile, report, role, sample, user } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { db } from "..";

export async function getUserById(id: string) {
  const result = await db.select().from(user).where(eq(user.id, id));
  return result[0];
}

export async function getAllUsers() {
  return await db.select().from(user);
}

export async function getAllUsersWithProfiles() {
  return await db
    .select({
      id: user.id,
      email: user.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      imageUrl: profile.imageUrl,
      roleId: profile.roleId,
      roleName: role.name,
    })
    .from(user)
    .leftJoin(profile, eq(user.id, profile.userId))
    .leftJoin(role, eq(profile.roleId, role.id));
}

export async function getAllProfiles() {
  return await db.select().from(profile);
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

export async function getSamplesByUserId(userId: string) {
  return await db.select().from(sample).where(eq(sample.uploadedBy, userId));
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

export async function getReportsBySampleId(sampleId: string) {
  return await db.select().from(report).where(eq(report.sampleId, sampleId));
}

export async function getReportById(reportId: string) {
  const result = await db.select().from(report).where(eq(report.id, reportId));
  return result[0];
}

export async function getReportsByGeneratedBy(userId: string) {
  return await db.select().from(report).where(eq(report.generatedBy, userId));
}

export async function getReportCountByPatientId(patientId: string) {
  const result = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(report)
    .innerJoin(sample, eq(report.sampleId, sample.id))
    .where(eq(sample.patientId, patientId));

  return Number(result[0]?.count ?? 0);
}