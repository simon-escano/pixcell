'use server'

import { db } from "@/db"
import { report } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function addReport(data: {
  title: string;
  content: any;
  testType: string;
  patientId: string;
  sampleId: string;
  isAiGenerated: boolean;
  generatedBy: string;
  status?: "Draft" | "Finalized" | "UNDER_REVIEW" | "REJECTED" | "ARCHIVED";
  organizationId?: string;
}) {
  try {
    await db.insert(report).values({
      ...data,
      status: data.status || "Draft",
      // Persist organization if provided; otherwise set to null
      organizationId: data.organizationId ?? null,
      createdAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to add report:", error);
    return { success: false, error: "Failed to add report" };
  }
}

export async function updateReport(id: string, data: {
  title?: string;
  content?: any;
  testType?: string;
  status?: "Draft" | "Finalized" | "UNDER_REVIEW" | "REJECTED" | "ARCHIVED";
  exportedUrl?: string;
  exportFormat?: string;
}) {
  try {
    // Map legacy status values to allowed enum values
    let mappedStatus = data.status;
    await db.update(report)
      .set({ ...data, status: mappedStatus })
      .where(eq(report.id, id));
    return { success: true };
  } catch (error) {
    console.error("Failed to update report:", error);
    return { success: false, error: "Failed to update report data" };
  }
}

export async function deleteReport(reportId: string) {
  try {
    const reportData = await db.select().from(report).where(eq(report.id, reportId)).limit(1);

    if (reportData.length === 0) {
      return { success: false, error: "Report not found" };
    }

    await db.delete(report).where(eq(report.id, reportId));
    return { success: true };
  } catch (error) {
    console.error("Failed to delete report:", error);
    return { success: false, error: "Failed to delete report" };
  }
}

export async function getSamplesByPatientIdAction(patientId: string) {
  try {
    const { getSamplesByPatientId } = await import("@/db/queries/select");
    const samples = await getSamplesByPatientId(patientId);
    return { success: true, data: samples };
  } catch (error) {
    console.error("Failed to fetch samples:", error);
    return { success: false, error: "Failed to fetch samples" };
  }
}
