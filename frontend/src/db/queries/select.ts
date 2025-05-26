import { patient, profile, report, role, sample, user, image, note, sample_image } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { db } from "..";

import { alias } from 'drizzle-orm/pg-core';

const patientImage = alias(image, 'patientImage');
const generatedByImage = alias(image, 'generatedByImage');
const profileImage = alias(image, 'profileImage');
const sampleImg = alias(image, 'sampleImg');

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
      roleId: profile.roleId,
      roleName: role.name,
    })
    .from(user)
    .innerJoin(profile, eq(user.id, profile.userId))
    .innerJoin(role, eq(profile.roleId, role.id));
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
  return await db.select().from(sample).where(eq(sample.createdBy, userId));
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
      generatedByRole: role.name
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
      dateTaken: sample_image.capturedAt,
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
    .leftJoin(sample_image, eq(sample.id, sample_image.sampleId))
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
      capturedAt: sample_image.capturedAt,
      imageUrl: sampleImg.imageUrl,
      patientName: sql<string>`concat(${patient.firstName}, ' ', ${patient.lastName})`,
      uploadedBy: sql<string>`concat(${profile.firstName}, ' ', ${profile.lastName})`,
    })
    .from(sample)
    .leftJoin(patient, eq(sample.patientId, patient.id))
    .leftJoin(sample_image, eq(sample.id, sample_image.sampleId))
    .leftJoin(profile, eq(sample_image.uploadedBy, profile.id))
    .leftJoin(user, eq(profile.userId, user.id))
    .leftJoin(sampleImg, eq(sample_image.imageId, sampleImg.id))
    .orderBy(sample_image.capturedAt)
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
      generatedByRole: role.name
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