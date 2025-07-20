"use server"
import { getUser } from "@/lib/auth";

import { 
  getAllPatientsForUser, 
  getAllSamples, 
  getReportCountByPatientId,
  getReportsLast30Days,
  getPatientsWithLastReport,
  getRecentUploads,
  getPatientGenderStats,
  getMonthlyStats,
  getProfileByUserId, 
  getRoleById,
  getSamplesByUserId,
  getReportsLast30DaysByUser,
  getPatientsWithLastReportByUser,
  getRecentUploadsByUser,
  getPatientGenderStatsByUser
} from "@/db/queries/select"
import { db } from "@/db"
import { patient, sample, report, sampleImage } from "@/db/schema"
import { sql } from "drizzle-orm"

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

export async function getDashboardStats() {
  try {
    const user = await getUser();
    const profile = await getProfileByUserId(user.id);
    const role = await getRoleById(profile.roleId);

    console.log(profile)
    console.log(role)
    const [
      patients,
      samples,
      reportsLast30Days,
      patientsWithLastReport,
      recentUploads,
      genderStats,
      monthlyStats
    ] = await Promise.all([
      getAllPatientsForUser(profile.id, role.name),
      getSamplesByUserId(user.id),
      getReportsLast30DaysByUser(user.id),
      getPatientsWithLastReportByUser(user.id),
      getRecentUploadsByUser(user.id),
      getPatientGenderStatsByUser(user.id),
      getMonthlyStats()
    ]);
    
    // Calculate total reports across all patients
    const reportCounts = await Promise.all(
      patients.map(patient => getReportCountByPatientId(patient.id))
    )
    const totalReports = reportCounts.reduce((a, b) => a + b, 0)

    // Calculate percentage changes for all metrics
    const [patientsChange, samplesChange, reportsChange] = await Promise.all([
      getMonthlyChange(patient, patient.createdAt),
      getSampleMonthlyChange(),
      getMonthlyChange(report, report.createdAt)
    ]);

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
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
} 