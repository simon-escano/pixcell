"use server"
import { getUser } from "@/lib/auth";
import { cache } from "react";

import { db } from "@/db";
import {
  getAllPatientsForUser,
  getMonthlyStats,
  getPatientGenderStatsByUser,
  getPatientsWithLastReportByUser,
  getProfileByUserId,
  getRecentUploadsByUser,
  getReportCountByPatientId,
  getReportsLast30DaysByUser,
  getRoleByUserIdAndOrganizationId,
  getSamplesByUserId
} from "@/db/queries/select";
import { patient, report, sample, sampleImage } from "@/db/schema";
import { sql } from "drizzle-orm";

// Helper function to calculate monthly changes
async function getMonthlyChange(table: any, dateColumn: any) {
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = startOfCurrentMonth;

  const [currentMonthCount, lastMonthCount] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(table)
      .where(sql`${dateColumn} >= ${startOfCurrentMonth.toISOString()}`),
    db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(table)
      .where(sql`${dateColumn} >= ${startOfLastMonth.toISOString()} and ${dateColumn} < ${endOfLastMonth.toISOString()}`),
  ]);

  const current = Number(currentMonthCount[0]?.count ?? 0);
  const last = Number(lastMonthCount[0]?.count ?? 0);
  console.log('getMonthlyChange:', { current, last });
  
  if (last === 0) return null;
  return ((current - last) / last) * 100;
}

// Simplified function to get sample changes
async function getSampleMonthlyChange() {
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = startOfCurrentMonth;

  const [currentMonthCount, lastMonthCount] = await Promise.all([
    db
      .select({
        count: sql<number>`count(distinct ${sample.id})`,
      })
      .from(sample)
      .leftJoin(sampleImage, sql`${sample.id} = ${sampleImage.sampleId}`)
      .where(sql`${sampleImage.capturedAt} >= ${startOfCurrentMonth.toISOString()}`),
    db
      .select({
        count: sql<number>`count(distinct ${sample.id})`,
      })
      .from(sample)
      .leftJoin(sampleImage, sql`${sample.id} = ${sampleImage.sampleId}`)
      .where(sql`${sampleImage.capturedAt} >= ${startOfLastMonth.toISOString()} and ${sampleImage.capturedAt} < ${endOfLastMonth.toISOString()}`),
  ]);

  const current = Number(currentMonthCount[0]?.count ?? 0);
  const last = Number(lastMonthCount[0]?.count ?? 0);
  console.log('getSampleMonthlyChange:', { current, last });
  
  if (last === 0) return null;
  return ((current - last) / last) * 100;
}

// Cache the dashboard stats function for request-level deduplication
const getDashboardStatsCached = cache(async (organizationId: string, userId: string, profileId: string, roleName: string) => {
  // Parallelize all independent data fetching operations
  const [
    patients,
    samples,
    reportsLast30Days,
    patientsWithLastReport,
    recentUploads,
    genderStats,
    monthlyStats,
    patientsChange,
    samplesChange,
    reportsChange
  ] = await Promise.all([
    getAllPatientsForUser(profileId, roleName, organizationId),
    getSamplesByUserId(userId, organizationId),
    getReportsLast30DaysByUser(userId),
    getPatientsWithLastReportByUser(userId),
    getRecentUploadsByUser(userId),
    getPatientGenderStatsByUser(userId),
    getMonthlyStats(),
    getMonthlyChange(patient, patient.createdAt),
    getSampleMonthlyChange(),
    getMonthlyChange(report, report.createdAt)
  ]);
  
  // Calculate total reports across all patients in parallel
  const reportCounts = await Promise.all(
    patients.map(patient => getReportCountByPatientId(patient.id))
  );
  const totalReports = reportCounts.reduce((a, b) => a + b, 0);

  // Calculate percentage changes for existing metrics
  const appointmentsChange = monthlyStats.lastMonth.totalAppointments 
    ? ((monthlyStats.currentMonth.totalAppointments - monthlyStats.lastMonth.totalAppointments) / monthlyStats.lastMonth.totalAppointments) * 100
    : 0;
  
  const newPatientsChange = monthlyStats.lastMonth.newPatients
    ? ((monthlyStats.currentMonth.newPatients - monthlyStats.lastMonth.newPatients) / monthlyStats.lastMonth.newPatients) * 100
    : 0;

  return {
    totalPatients: patients.length,
    totalSamples: samples.length,
    totalReports,
    activeUsers: 0, // TODO: Implement active users tracking
    reportsLast30Days,
    reportsPerPatient: patients.length ? totalReports / patients.length : 0,
    patientsWithLastReport,
    recentUploads,
    genderStats,
    monthlyStats: {
      ...monthlyStats.currentMonth,
      appointmentsChange,
      newPatientsChange
    },
    // Add percentage changes for all metrics
    patientsChange: patientsChange || 0,
    samplesChange: samplesChange || 0,
    reportsChange: reportsChange || 0
  };
});

export async function getDashboardStats(organizationId: string) {
  try {
    const user = await getUser();
    
    // Parallelize profile and role fetching (they're independent)
    const [profile, role] = await Promise.all([
      getProfileByUserId(user.id),
      getRoleByUserIdAndOrganizationId(user.id, organizationId)
    ]);

    console.log(profile)
    console.log(role)

    return await getDashboardStatsCached(
      organizationId,
      user.id,
      profile.id,
      role?.name || ""
    );
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
} 