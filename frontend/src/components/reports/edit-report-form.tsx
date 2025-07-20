'use client';
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { TableEditor, TableDisplay } from "@/components/reports/table-editor";
import ReportPreview from "@/components/reports/report-preview";
import ReportForm from "./ReportForm";
import { updateReport } from "@/actions/reports";

export default function EditReportForm({
  patients,
  currentUserId,
  profiles,
  role,
  initialFormData,
  initialReportContent,
  selectedPatientId: initialPatientId,
  selectedSampleId: initialSampleId,
  reportId,
}: any) {
  return (
    <ReportForm
      mode="edit"
      onSubmit={(args) => updateReport(reportId, args[1])}
      patients={patients}
      profiles={profiles}
      role={role}
      currentUserId={currentUserId}
      reportId={reportId}
      initialFormData={initialFormData}
      initialReportContent={initialReportContent}
      initialPatientId={initialPatientId}
      initialSampleId={initialSampleId}
    />
  );
} 