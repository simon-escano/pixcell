"use client";
import ImprovedReportForm from "./report-form";
import { updateReport } from "@/actions/reports";

export default function EditReportForm({
  patients,
  currentUserId,
  profiles,
  role,
  initialFormData,
  initialReportContent,
  reportId,
  initialPatientId,
  initialSampleId,
}: any) {
  return (
    <ImprovedReportForm
      mode="edit"
      onSubmit={([reportId, data]: [string, any]) => updateReport(reportId, data)}
      patients={patients}
      currentUserId={currentUserId}
      profiles={profiles}
      role={role}
      initialFormData={initialFormData}
      initialReportContent={initialReportContent}
      reportId={reportId}
      initialPatientId={initialPatientId}
      initialSampleId={initialSampleId}
    />
  );
} 