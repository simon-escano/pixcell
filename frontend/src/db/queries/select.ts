import { doctorPatient, feedback, image, patient, profile, report, role, sample, sampleImage, user } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "..";

import { createClient } from '@supabase/supabase-js';
import { alias } from 'drizzle-orm/pg-core';

const patientImage = alias(image, 'patientImage');
const generatedByImage = alias(image, 'generatedByImage');
const profileImage = alias(image, 'profileImage');
const sampleImg = alias(image, 'sampleImg');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Only use service role key on the server!
);

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
      phone: user.phone,
      firstName: profile.firstName,
      lastName: profile.lastName,
      imageId: profile.imageId,
      imageUrl: image.imageUrl,
      roleId: profile.roleId,
      roleName: role.name,
    })
    .from(user)
    .innerJoin(profile, eq(user.id, profile.userId))
    .innerJoin(role, eq(profile.roleId, role.id))
    .leftJoin(image, eq(profile.imageId, image.id));
}

export async function getAllProfiles() {
  return await db.select().from(profile);
}

/**
 * Get all patients for the current user.
 * If the user is an administrator, return all patients.
 * If the user is a doctor, return only assigned patients (via doctor_patient).
 * @param profileId - The current user's profile id
 * @param roleName - The current user's role name (e.g., 'Administrator')
 */
export async function getAllPatientsForUser(profileId: string, roleName: string) {
  if (roleName === "Administrator") {
    // Return all patients
    return await db
      .select({
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        contactNumber: patient.contactNumber,
        address: patient.address,
        height: patient.height,
        weight: patient.weight,
        sex: patient.sex,
        bloodType: patient.bloodType,
        birthDate: patient.birthDate,
        createdAt: patient.createdAt,
        imageId: patient.imageId,
        imageUrl: image.imageUrl,
        createdBy: patient.createdBy
      })
      .from(patient)
      .leftJoin(image, eq(patient.imageId, image.id));
  } else {
    // Return only patients assigned to this doctor
    return await db
      .select({
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        contactNumber: patient.contactNumber,
        address: patient.address,
        height: patient.height,
        weight: patient.weight,
        sex: patient.sex,
        bloodType: patient.bloodType,
        birthDate: patient.birthDate,
        createdAt: patient.createdAt,
        imageId: patient.imageId,
        imageUrl: image.imageUrl
      })
      .from(patient)
      .innerJoin(doctorPatient, eq(doctorPatient.patientId, patient.id))
      .leftJoin(image, eq(patient.imageId, image.id))
      .where(eq(doctorPatient.doctorId, profileId));
  }
}

export async function getPatientById(id: string) {
  const result = await db
    .select({
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      contactNumber: patient.contactNumber,
      address: patient.address,
      height: patient.height,
      weight: patient.weight,
      sex: patient.sex,
      bloodType: patient.bloodType,
      birthDate: patient.birthDate,
      createdAt: patient.createdAt,
      imageId: patient.imageId,
      imageUrl: image.imageUrl
    })
    .from(patient)
    .leftJoin(image, eq(patient.imageId, image.id))
    .where(eq(patient.id, id));
  return result[0];
}

export async function getSamplesByPatientId(id: string) {
  return await db
    .select({
      id: sample.id,
      patientId: sample.patientId,
      sampleName: sample.sampleName,
      createdBy: sample.createdBy,
      // From sample_image table
      uploadedBy: sampleImage.uploadedBy,
      metadata: sampleImage.metadata,
      capturedAt: sampleImage.capturedAt,
      imageId: sampleImage.imageId,
      imageUrl: sampleImg.imageUrl
    })
    .from(sample)
    .leftJoin(sampleImage, eq(sample.id, sampleImage.sampleId))
    .leftJoin(sampleImg, eq(sampleImage.imageId, sampleImg.id))
    .where(eq(sample.patientId, id));
}

export async function getSamplesByUserId(userId: string) {
  return await db
    .select({
      id: sample.id,
      patientId: sample.patientId,
      sampleName: sample.sampleName,
      createdBy: sample.createdBy,
      // From sample_image table
      uploadedBy: sampleImage.uploadedBy,
      metadata: sampleImage.metadata,
      capturedAt: sampleImage.capturedAt,
      imageId: sampleImage.imageId,
      imageUrl: sampleImg.imageUrl
    })
    .from(sample)
    .leftJoin(sampleImage, eq(sample.id, sampleImage.sampleId))
    .leftJoin(sampleImg, eq(sampleImage.imageId, sampleImg.id))
    .where(eq(sample.createdBy, userId));
}

export async function getSampleById(id: string) {
  const result = await db
    .select({
      id: sample.id,
      patientId: sample.patientId,
      sampleName: sample.sampleName,
      createdBy: sample.createdBy,
      // From sample_image table
      uploadedBy: sampleImage.uploadedBy,
      metadata: sampleImage.metadata,
      capturedAt: sampleImage.capturedAt,
      imageId: sampleImage.imageId,
      imageUrl: sampleImg.imageUrl
    })
    .from(sample)
    .leftJoin(sampleImage, eq(sample.id, sampleImage.sampleId))
    .leftJoin(sampleImg, eq(sampleImage.imageId, sampleImg.id))
    .where(eq(sample.id, id));
  return result[0];
}

export async function getAllSamples() {
  return await db
    .select({
      id: sample.id,
      patientId: sample.patientId,
      sampleName: sample.sampleName,
      createdBy: sample.createdBy,
      // From sample_image table
      uploadedBy: sampleImage.uploadedBy,
      metadata: sampleImage.metadata,
      capturedAt: sampleImage.capturedAt,
      imageId: sampleImage.imageId,
      imageUrl: sampleImg.imageUrl
    })
    .from(sample)
    .leftJoin(sampleImage, eq(sample.id, sampleImage.sampleId))
    .leftJoin(sampleImg, eq(sampleImage.imageId, sampleImg.id));
}

export async function getProfileByUserId(userId: string) {
  const result = await db
    .select({
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      userId: profile.userId,
      roleId: profile.roleId,
      imageId: profile.imageId,
      imageUrl: image.imageUrl
    })
    .from(profile)
    .leftJoin(image, eq(profile.imageId, image.id))
    .where(eq(profile.userId, userId));
  return result[0];
}

export async function getRoleById(id: string) {
  const result = await db.select().from(role).where(eq(role.id, id));
  return result[0];
}

export async function getAllRoles() {
  return await db.select().from(role);
}

export async function getReportsBySampleId(sampleId: string) {
  return await db.select().from(report).where(eq(report.sampleId, sampleId));
}

export async function getReportById(reportId: string) {
  const result = await db.select().from(report).where(eq(report.id, reportId));
  return result[0];
}

export async function getReportsByGeneratedBy(userId: string) {
  return await db
    .select({
      id: report.id,
      title: report.title,
      content: report.content,
      isAiGenerated: report.isAiGenerated,
      createdAt: report.createdAt,
      exportedUrl: report.exportedUrl,
      exportFormat: report.exportFormat,
      sampleId: sample.id,
      sampleName: sample.sampleName,
      patientId: patient.id,
      patientName: sql<string>`concat(${patient.firstName}, ' ', ${patient.lastName})`,
      patientImage: patientImage.imageUrl,
      generatedById: user.id,
      generatedByName: sql<string>`concat(${profile.firstName}, ' ', ${profile.lastName})`,
      generatedByImage: generatedByImage.imageUrl,
      generatedByRole: role.name,
      status: report.status
    })
    .from(report)
    .leftJoin(sample, eq(report.sampleId, sample.id))
    .leftJoin(patient, eq(sample.patientId, patient.id))
    .leftJoin(patientImage, eq(patient.imageId, patientImage.id))
    .leftJoin(user, eq(report.generatedBy, user.id))
    .leftJoin(profile, eq(user.id, profile.userId))
    .leftJoin(generatedByImage, eq(profile.imageId, generatedByImage.id))
    .leftJoin(role, eq(profile.roleId, role.id))
    .where(eq(report.generatedBy, userId))
    .orderBy(report.createdAt);
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

export async function getReportsLast30Days() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(report)
    .where(sql`${report.createdAt} >= ${thirtyDaysAgo.toISOString()}`);

  return Number(result[0]?.count ?? 0);
}

export async function getPatientsWithLastReport() {
  return await db
    .select({
      patientId: patient.id,
      patientName: sql<string>`concat(${patient.firstName}, ' ', ${patient.lastName})`,
      sampleId: sample.id,
      sampleName: sample.sampleName,
      dateTaken: sampleImage.capturedAt,
      userId: user.id,
      userName: sql<string>`concat(${profile.firstName}, ' ', ${profile.lastName})`,
      userEmail: patient.email,
      userImage: profileImage.imageUrl,
      isAiGenerated: report.isAiGenerated,
      reportCreatedAt: report.createdAt
    })
    .from(patient)
    .leftJoin(sample, eq(patient.id, sample.patientId))
    .innerJoin(report, eq(sample.id, report.sampleId))
    .leftJoin(sampleImage, eq(sample.id, sampleImage.sampleId))
    .leftJoin(user, eq(report.generatedBy, user.id))
    .leftJoin(profile, eq(user.id, profile.userId))
    .leftJoin(profileImage, eq(profile.imageId, profileImage.id))
    .orderBy(report.createdAt)
    .limit(5);
}

export async function getRecentUploads() {
  return await db
    .select({
      id: sample.id,
      sampleName: sample.sampleName,
      capturedAt: sampleImage.capturedAt,
      imageUrl: sampleImg.imageUrl,
      patientName: sql<string>`concat(${patient.firstName}, ' ', ${patient.lastName})`,
      uploadedBy: sql<string>`concat(${profile.firstName}, ' ', ${profile.lastName})`,
    })
    .from(sample)
    .leftJoin(patient, eq(sample.patientId, patient.id))
    .leftJoin(sampleImage, eq(sample.id, sampleImage.sampleId))
    .leftJoin(profile, eq(sampleImage.uploadedBy, profile.id))
    .leftJoin(user, eq(profile.userId, user.id))
    .leftJoin(sampleImg, eq(sampleImage.imageId, sampleImg.id))
    .orderBy(sampleImage.capturedAt)
    .limit(5);
}

export async function getPatientGenderStats() {
  const result = await db
    .select({
      gender: patient.sex,
      count: sql<number>`count(*)`,
      month: sql<string>`to_char(${patient.createdAt}, 'YYYY-MM')`,
    })
    .from(patient)
    .groupBy(patient.sex, sql`to_char(${patient.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${patient.createdAt}, 'YYYY-MM')`);

  return result;
}

export async function getMonthlyStats() {
  const currentMonth = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const [currentMonthStats, lastMonthStats] = await Promise.all([
    db
      .select({
        totalAppointments: sql<number>`count(*)`,
        newPatients: sql<number>`count(distinct ${patient.id})`,
      })
      .from(report)
      .leftJoin(sample, eq(report.sampleId, sample.id))
      .leftJoin(patient, eq(sample.patientId, patient.id))
      .where(sql`${report.createdAt} >= ${currentMonth.toISOString()}`),
    db
      .select({
        totalAppointments: sql<number>`count(*)`,
        newPatients: sql<number>`count(distinct ${patient.id})`,
      })
      .from(report)
      .leftJoin(sample, eq(report.sampleId, sample.id))
      .leftJoin(patient, eq(sample.patientId, patient.id))
      .where(sql`${report.createdAt} >= ${lastMonth.toISOString()} and ${report.createdAt} < ${currentMonth.toISOString()}`),
  ]);

  return {
    currentMonth: currentMonthStats[0],
    lastMonth: lastMonthStats[0],
  };
}

export async function getAllReports() {
  return await db
    .select({
      id: report.id,
      content: report.content,
      isAiGenerated: report.isAiGenerated,
      createdAt: report.createdAt,
      exportedUrl: report.exportedUrl,
      exportFormat: report.exportFormat,
      sampleId: sample.id,
      sampleName: sample.sampleName,
      patientId: patient.id,
      patientName: sql<string>`concat(${patient.firstName}, ' ', ${patient.lastName})`,
      patientImage: patientImage.imageUrl,
      generatedById: user.id,
      generatedByName: sql<string>`concat(${profile.firstName}, ' ', ${profile.lastName})`,
      generatedByImage: generatedByImage.imageUrl,
      generatedByRole: role.name,
      title: report.title,
    })
    .from(report)
    .leftJoin(sample, eq(report.sampleId, sample.id))
    .leftJoin(patient, eq(sample.patientId, patient.id))
    .leftJoin(patientImage, eq(patient.imageId, patientImage.id))
    .leftJoin(user, eq(report.generatedBy, user.id))
    .leftJoin(profile, eq(user.id, profile.userId))
    .leftJoin(generatedByImage, eq(profile.imageId, generatedByImage.id))
    .leftJoin(role, eq(profile.roleId, role.id))
    .orderBy(report.createdAt);
}

export async function getImageURLFromImageId(imageId: string) {
  const result = await db
    .select({ imageUrl: image.imageUrl })
    .from(image)
    .where(eq(image.id, imageId));
  
  return result[0]?.imageUrl || null;
}

export async function getSupabaseUserCount() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  return data.users.length;
}

export async function getFeedbackByUser(userId: string) {
  return await db
    .select()
    .from(feedback)
    .where(eq(feedback.userId, userId))
    .orderBy(desc(feedback.createdAt));
}