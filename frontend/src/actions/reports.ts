'use server'

import { db } from "@/db"
import { report } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

export async function addReport(data: {
  title: string;
  content: any;
  testType: string;
  patientId: string;
  sampleId: string;
  isAiGenerated: boolean;
  generatedBy: string;
  status?: "Draft" | "Finalized" | "Under Review" | "Rejected" | "Archived" | string;
  organizationId: string;
  code?: string;
}) {
  try {
    await db.insert(report).values({
      title: data.title,
      content: data.content,
      testType: data.testType,
      patientId: data.patientId,
      sampleId: data.sampleId,
      isAiGenerated: data.isAiGenerated,
      generatedBy: data.generatedBy,
      status: (data.status as any) || "Draft",
      organizationId: data.organizationId,
      code: data.code,
      createdAt: new Date(),
    });

    // Revalidate cache
    revalidateTag(CACHE_TAGS.reports);
    revalidatePath('/organizations');
    revalidatePath('/reports');

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
  status?: "Draft" | "Finalized" | "Under Review" | "Rejected" | "Archived" | string;
  exportedUrl?: string;
  exportFormat?: string;
}) {
  try {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.testType !== undefined) updateData.testType = data.testType;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.exportedUrl !== undefined) updateData.exportedUrl = data.exportedUrl;
    if (data.exportFormat !== undefined) updateData.exportFormat = data.exportFormat;

    await db.update(report)
      .set(updateData)
      .where(eq(report.id, id));

    // Revalidate cache
    revalidateTag(CACHE_TAGS.reports);
    revalidateTag(`report-${id}`);
    revalidatePath('/organizations');
    revalidatePath('/reports');

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

    // Revalidate cache
    revalidateTag(CACHE_TAGS.reports);
    revalidateTag(`report-${reportId}`);
    revalidatePath('/organizations');
    revalidatePath('/reports');

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
