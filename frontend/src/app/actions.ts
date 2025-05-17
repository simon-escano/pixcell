"use server"

import { 
  getAllPatients, 
  getAllSamples, 
  getReportCountByPatientId,
  getReportsLast30Days 
} from "@/db/queries/select"

export async function getDashboardStats() {
  try {
    const patients = await getAllPatients()
    const samples = await getAllSamples()
    const reportsLast30Days = await getReportsLast30Days()
    
    // Calculate total reports across all patients
    const reportCounts = await Promise.all(
      patients.map(patient => getReportCountByPatientId(patient.id))
    )
    const totalReports = reportCounts.reduce((a, b) => a + b, 0)

    return {
      totalPatients: patients.length,
      totalSamples: samples.length,
      totalReports,
      activeUsers: 0, // TODO: Implement active users tracking
      reportsLast30Days,
      reportsPerPatient: patients.length ? totalReports / patients.length : 0
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
} 