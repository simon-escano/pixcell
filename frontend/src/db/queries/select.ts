import { doctorPatient, feedback, image, organization, organizationStaff, organizationPatient, patient, profile, report, role, sample, sampleImage, sampleImageAi, user } from "@/db/schema";
import { desc, eq, sql, and } from "drizzle-orm";
import { db } from '..';
import { alias } from "drizzle-orm/pg-core";
import { withCache, CACHE_TAGS, CACHE_REVALIDATE_TIMES, withRequestCache } from "@/lib/cache";
import { cache } from "react";

import { createClient } from '@supabase/supabase-js';

const backend_url = process.env.BACKEND_URL;

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

// Note: This function is deprecated - use getAllUsersWithProfiles(organizationId) instead
// Keeping for backward compatibility but roleId/roleName will be null without organizationId
export async function getAllUsersWithProfiles2() {
  return await db
    .select({
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: profile.firstName,
      lastName: profile.lastName,
      imageId: profile.imageId,
      imageUrl: image.imageUrl,
    })
    .from(user)
    .innerJoin(profile, eq(user.id, profile.userId))
    .leftJoin(image, eq(profile.imageId, image.id))
    .then(results => results.map(r => ({ ...r, roleId: null as string | null, roleName: null as string | null })));
}

// Cache at request level for deduplication
const getAllUsersWithProfilesCached = cache(async (organizationId: string) => {
  return await db
    .select({
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: profile.firstName,
      lastName: profile.lastName,
      imageId: profile.imageId,
      imageUrl: image.imageUrl,
      roleId: organizationStaff.roleId,
      roleName: role.name,
      updatedAt: organizationStaff.updatedAt,
    })
    .from(user)
    .innerJoin(profile, eq(user.id, profile.userId))
    .innerJoin(organizationStaff, eq(profile.id, organizationStaff.staffId))
    .innerJoin(role, eq(organizationStaff.roleId, role.id))
    .leftJoin(image, eq(profile.imageId, image.id))
    .where(eq(organizationStaff.organizationId, organizationId))
    .orderBy(desc(organizationStaff.updatedAt));
});

export async function getAllUsersWithProfiles(organizationId: string) {
  return getAllUsersWithProfilesCached(organizationId);
}

export async function getAllProfiles() {
  return await db.select().from(profile);
}

export async function getAllPatientsForUser(
  profileId: string,
  roleName: string,
  organizationId: string,
  withSamplesOnly = false
) {
  const baseSelection = {
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
    createdBy: patient.createdBy,
  };

  let query;

  if (roleName === "Administrator") {
    query = db
      .select(baseSelection)
      .from(patient)
      .innerJoin(
        organizationPatient,
        eq(organizationPatient.patientId, patient.id)
      )
      .leftJoin(image, eq(patient.imageId, image.id))
      .where(eq(organizationPatient.organizationId, organizationId));

    if (withSamplesOnly) {
      query = query.innerJoin(sample, eq(patient.id, sample.patientId));
    }
  } else {
    query = db
      .select(baseSelection)
      .from(doctorPatient)
      .innerJoin(patient, eq(doctorPatient.patientId, patient.id))
      .innerJoin(
        organizationPatient,
        eq(organizationPatient.patientId, patient.id)
      )
      .leftJoin(image, eq(patient.imageId, image.id))
      .where(
        and(
          eq(doctorPatient.doctorId, profileId),
          eq(organizationPatient.organizationId, organizationId)
        )
      );

    if (withSamplesOnly) {
      query = query.innerJoin(sample, eq(patient.id, sample.patientId));
    }
  }

  const results = await query;

  const seen = new Set<string>();
  const unique = results.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  return unique;
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

export async function isPatientInOrganization(patientId: string, organizationId: string): Promise<boolean> {
  const result = await db
    .select({ id: organizationPatient.id })
    .from(organizationPatient)
    .where(
      and(
        eq(organizationPatient.patientId, patientId),
        eq(organizationPatient.organizationId, organizationId)
      )
    )
    .limit(1);
  return result.length > 0;
}

export async function getSamplesByPatientId(id: string) {
  return await db
    .select({
      id: sample.id,
      patientId: sample.patientId,
      sampleName: sample.sampleName,
      createdBy: sample.createdBy,
      // From sampleImage table
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

export async function getSamplesByUserId(userId: string, organizationId: string) {
  // 1. Samples created directly by the user AND belonging to the specified organization
  const directSamples = db
    .select({
      id: sample.id,
      patientId: sample.patientId,
      sampleName: sample.sampleName,
      createdBy: sample.createdBy,
      uploadedBy: sampleImage.uploadedBy,
      metadata: sampleImage.metadata,
      capturedAt: sampleImage.capturedAt,
      imageId: sampleImage.imageId,
      imageUrl: sampleImg.imageUrl,
    })
    .from(sample)
    .leftJoin(sampleImage, eq(sample.id, sampleImage.sampleId))
    .leftJoin(sampleImg, eq(sampleImage.imageId, sampleImg.id))
    .where(
      and(
        eq(sample.createdBy, userId),
        eq(sample.organizationId, organizationId) // <-- Filter by organization ID
      )
    );

  // 2. Samples linked to the user's patients (via doctorPatient table) AND belonging to the specified organization
  const patientSamples = db
    .select({
      id: sample.id,
      patientId: sample.patientId,
      sampleName: sample.sampleName,
      createdBy: sample.createdBy,
      uploadedBy: sampleImage.uploadedBy,
      metadata: sampleImage.metadata,
      capturedAt: sampleImage.capturedAt,
      imageId: sampleImage.imageId,
      imageUrl: sampleImg.imageUrl,
    })
    .from(doctorPatient)
    .innerJoin(sample, eq(doctorPatient.patientId, sample.patientId))
    .leftJoin(sampleImage, eq(sample.id, sampleImage.sampleId))
    .leftJoin(sampleImg, eq(sampleImage.imageId, sampleImg.id))
    .where(
      and(
        eq(doctorPatient.doctorId, userId),
        eq(sample.organizationId, organizationId) // <-- Filter by organization ID
      )
    );

  const [direct, patients] = await Promise.all([directSamples, patientSamples]);

  // Combine results and deduplicate
  const seen = new Set<string>();
  return [...direct, ...patients].filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

export async function getSampleById(id: string) {
  const result = await db
    .select({
      id: sample.id,
      patientId: sample.patientId,
      sampleName: sample.sampleName,
      createdBy: sample.createdBy,
      organizationId: sample.organizationId,
      // From sampleImage table
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

// Cache at request level for deduplication
const getAllSamplesCached = cache(async (organizationId: string) => {
  return await db
    .select()
    .from(sample)
    .where(eq(sample.organizationId, organizationId));
});

export async function getAllSamples(organizationId: string) {
  return getAllSamplesCached(organizationId);
}

const getProfileByUserIdCached = withCache(
  async (userId: string) => {
    const result = await db
      .select({
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        userId: profile.userId,
        roleId: profile.roleId,
        imageId: profile.imageId,
        imageUrl: image.imageUrl,
        licenseNo: profile.licenseNo,
        mustChangePassword: profile.mustChangePassword,
      })
      .from(profile)
      .leftJoin(image, eq(profile.imageId, image.id))
      .where(eq(profile.userId, userId));
    return result[0];
  },
  ['profile-by-user-id'],
  {
    tags: [CACHE_TAGS.profiles],
    revalidate: CACHE_REVALIDATE_TIMES.medium,
  }
);

export async function getProfileByUserId(userId: string) {
  return getProfileByUserIdCached(userId);
}

export async function getRoleById(id: string) {
  const result = await db.select().from(role).where(eq(role.id, id));
  return result[0];
}

const getRoleByUserIdAndOrganizationIdCached = withCache(
  async (userId: string, organizationId: string) => {
    const result = await db
      .select({
        id: role.id,
        name: role.name,
      })
      .from(organizationStaff)
      .innerJoin(profile, eq(organizationStaff.staffId, profile.id))
      .innerJoin(role, eq(organizationStaff.roleId, role.id))
      .where(
        and(
          eq(profile.userId, userId),
          eq(organizationStaff.organizationId, organizationId)
        )
      )
      .limit(1);
    return result[0] || null;
  },
  ['role-by-user-org'],
  {
    tags: [CACHE_TAGS.profiles, CACHE_TAGS.organizations],
    revalidate: CACHE_REVALIDATE_TIMES.medium,
  }
);

export async function getRoleByUserIdAndOrganizationId(userId: string, organizationId: string) {
  return getRoleByUserIdAndOrganizationIdCached(userId, organizationId);
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

export async function getReportByCode(code: string) {
  const result = await db.select().from(report).where(eq(report.code, code));
  return result[0] || null;
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
      status: report.status,
      testType: report.testType
    })
    .from(report)
    .leftJoin(sample, eq(report.sampleId, sample.id))
    .leftJoin(patient, eq(sample.patientId, patient.id))
    .leftJoin(patientImage, eq(patient.imageId, patientImage.id))
    .leftJoin(user, eq(report.generatedBy, user.id))
    .leftJoin(profile, eq(user.id, profile.userId))
    .leftJoin(generatedByImage, eq(profile.imageId, generatedByImage.id))
    .leftJoin(organizationStaff, and(
      eq(organizationStaff.staffId, profile.id),
      eq(organizationStaff.organizationId, report.organizationId)
    ))
    .leftJoin(role, eq(organizationStaff.roleId, role.id))
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

export async function getReportsLast30DaysByUser(userId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(report)
    .where(sql`${report.createdAt} >= ${thirtyDaysAgo.toISOString()} and ${report.generatedBy} = ${userId}`);

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

export async function getPatientsWithLastReportByUser(userId: string) {
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
    .where(eq(report.generatedBy, userId))
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

export async function getRecentUploadsByUser(userId: string) {
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
    .where(eq(sample.createdBy, userId))
    .orderBy(sampleImage.capturedAt)
    .limit(5);
}

export async function getPatientGenderStats(organizationId: string) {
  const result = await db
    .select({
      gender: patient.sex,
      count: sql<number>`count(*)`,
      month: sql<string>`to_char(${patient.createdAt}, 'YYYY-MM')`,
    })
    .from(patient)
    .innerJoin(
      organizationPatient,
      eq(patient.id, organizationPatient.patientId) // Join condition
    )
    .where(
      eq(organizationPatient.organizationId, organizationId) // Filter by organizationId
    )
    .groupBy(patient.sex, sql`to_char(${patient.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${patient.createdAt}, 'YYYY-MM')`);

  return result;
}

export async function getPatientGenderStatsByUser(userId: string) {
  const result = await db
    .select({
      gender: patient.sex,
      count: sql<number>`count(*)`,
      month: sql<string>`to_char(${patient.createdAt}, 'YYYY-MM')`,
    })
    .from(patient)
    .where(eq(patient.createdBy, userId))
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

// Cache at request level for deduplication
const getAllReportsCached = cache(async (organizationId: string) => {
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
      testType: report.testType,
      status: report.status,
    })
    .from(report)
    // 1. Add the filter here, based on the new report.organizationId column
    .where(eq(report.organizationId, organizationId))
    // Existing joins
    .leftJoin(sample, eq(report.sampleId, sample.id))
    .leftJoin(patient, eq(sample.patientId, patient.id))
    .leftJoin(patientImage, eq(patient.imageId, patientImage.id))
    .leftJoin(user, eq(report.generatedBy, user.id))
    .leftJoin(profile, eq(user.id, profile.userId))
    .leftJoin(generatedByImage, eq(profile.imageId, generatedByImage.id))
    .leftJoin(organizationStaff, and(
      eq(organizationStaff.staffId, profile.id),
      eq(organizationStaff.organizationId, report.organizationId)
    ))
    .leftJoin(role, eq(organizationStaff.roleId, role.id))
    .orderBy(report.createdAt);
});

export async function getAllReports(organizationId: string) {
  return getAllReportsCached(organizationId);
}

export async function getAllReportsByUserId(userId: string) {
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
      testType: report.testType,
    })
    .from(report)
    .leftJoin(sample, eq(report.sampleId, sample.id))
    .leftJoin(patient, eq(sample.patientId, patient.id))
    .leftJoin(patientImage, eq(patient.imageId, patientImage.id))
    .leftJoin(user, eq(report.generatedBy, user.id))
    .leftJoin(profile, eq(user.id, profile.userId))
    .leftJoin(generatedByImage, eq(profile.imageId, generatedByImage.id))
    .leftJoin(organizationStaff, and(
      eq(organizationStaff.staffId, profile.id),
      eq(organizationStaff.organizationId, report.organizationId)
    ))
    .leftJoin(role, eq(organizationStaff.roleId, role.id))
    .where(eq(report.generatedBy, userId))
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

export async function getAllDoctors(organizationId?: string) {
  // Return all profiles as doctors, excluding those with role 'Administrator'
  // If organizationId is provided, only return doctors from that organization
  // Otherwise, return doctors from any organization (may have duplicates if user has doctor role in multiple orgs)
  if (organizationId) {
    return await db
      .select({
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        userId: profile.userId,
        imageUrl: image.imageUrl,
        roleName: role.name,
      })
      .from(profile)
      .leftJoin(image, eq(profile.imageId, image.id))
      .innerJoin(organizationStaff, eq(organizationStaff.staffId, profile.id))
      .innerJoin(role, eq(organizationStaff.roleId, role.id))
      .where(
        and(
          sql`${role.name} != 'Administrator'`,
          eq(organizationStaff.organizationId, organizationId)
        )
      );
  } else {
  return await db
    .select({
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      userId: profile.userId,
      imageUrl: image.imageUrl,
      roleName: role.name,
    })
    .from(profile)
    .leftJoin(image, eq(profile.imageId, image.id))
      .innerJoin(organizationStaff, eq(organizationStaff.staffId, profile.id))
      .innerJoin(role, eq(organizationStaff.roleId, role.id))
    .where(sql`${role.name} != 'Administrator'`);
  }
}

export async function getDoctorForPatient(patientId: string) {
  const result = await db
    .select({ doctorId: doctorPatient.doctorId })
    .from(doctorPatient)
    .where(eq(doctorPatient.patientId, patientId));
  return result[0]?.doctorId || null;
}

export async function isDoctorAssociatedWithPatient(doctorId: string, patientId: string): Promise<boolean> {
  const result = await db
    .select({ id: doctorPatient.id })
    .from(doctorPatient)
    .where(and(eq(doctorPatient.doctorId, doctorId), eq(doctorPatient.patientId, patientId)))
    .limit(1);

  return result.length > 0;
}

export async function getReportsByPatientId(patientId: string) {
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
      status: report.status,
    })
    .from(report)
    .innerJoin(sample, eq(report.sampleId, sample.id))
    .innerJoin(patient, eq(sample.patientId, patient.id))
    .where(eq(patient.id, patientId))
    .orderBy(report.createdAt);
}

const getOrganizationByIdCached = withCache(
  async (organizationId: string) => {
    const organizations = await db
      .select()
      .from(organization)
      .where(eq(organization.id, organizationId));
    return organizations[0];
  },
  ['organization-by-id'],
  {
    tags: [CACHE_TAGS.organizations],
    revalidate: CACHE_REVALIDATE_TIMES.long,
  }
);

export const getOrganizationById = async (organizationId: string) => {
  return getOrganizationByIdCached(organizationId);
}

export const getOrganizationsByProfileId = async (profileId: string) => {
  const organizations = await db
    .select({
      id: organization.id,
      name: organization.name,
      address: organization.address,
      imageUrl: organization.image_url,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    })
    .from(organization)
    .innerJoin(
      organizationStaff,
      eq(organization.id, organizationStaff.organizationId)
    )
    .where(eq(organizationStaff.staffId, profileId));
  return organizations;
};

export async function getPatientsFromOrganizationForUser(
  profileId: string,
  roleName: string,
  organizationId: string,
  withSamplesOnly = false
) {
  const baseSelection = {
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
  }

  let query

  if (roleName === "Administrator") {
    query = db
      .select(baseSelection)
      .from(organizationPatient)
      .innerJoin(patient, eq(organizationPatient.patientId, patient.id))
      .leftJoin(image, eq(patient.imageId, image.id))
      .where(eq(organizationPatient.organizationId, organizationId))

    if (withSamplesOnly) {
      query = query.innerJoin(sample, eq(patient.id, sample.patientId))
    }
  } else {
    query = db
      .select(baseSelection)
      .from(organizationPatient)
      .innerJoin(patient, eq(organizationPatient.patientId, patient.id))
      .innerJoin(
        doctorPatient,
        eq(doctorPatient.patientId, patient.id)
      )
      .leftJoin(image, eq(patient.imageId, image.id))
      .where(
        and(
          eq(organizationPatient.organizationId, organizationId),
          eq(doctorPatient.doctorId, profileId)
        )
      )

    if (withSamplesOnly) {
      query = query.innerJoin(sample, eq(patient.id, sample.patientId))
    }
  }

  const results = await query

  const seen = new Set<string>()
  return results.filter(p => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
}

// Get AI-generated image for a sample image
export async function getSampleImageAiByOriginalId(originalSampleImageId: string) {
  const result = await db
    .select()
    .from(sampleImageAi)
    .where(eq(sampleImageAi.originalSampleImageId, originalSampleImageId))
    .orderBy(desc(sampleImageAi.createdAt))
    .limit(1);
  return result[0] || null;
}
