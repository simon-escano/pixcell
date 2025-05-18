"use server"

import { 
  getAllPatients, 
  getAllSamples, 
  getReportCountByPatientId,
  getReportsLast30Days,
  getPatientsWithLastReport,
  getRecentUploads,
  getPatientGenderStats,
  getMonthlyStats
} from "@/db/queries/select"

export async function getDashboardStats() {
  try {
    const [
      patients,
      samples,
      reportsLast30Days,
      patientsWithLastReport,
      recentUploads,
      genderStats,
      monthlyStats
    ] = await Promise.all([
      getAllPatients(),
      getAllSamples(),
      getReportsLast30Days(),
      getPatientsWithLastReport(),
      getRecentUploads(),
      getPatientGenderStats(),
      getMonthlyStats()
    ]);
    
    // Calculate total reports across all patients
    const reportCounts = await Promise.all(
      patients.map(patient => getReportCountByPatientId(patient.id))
    )
    const totalReports = reportCounts.reduce((a, b) => a + b, 0)

    // Calculate percentage changes
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
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
} 