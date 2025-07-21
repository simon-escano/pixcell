"use client";

import ImprovedReportForm from "./report-form";
import { addReport } from "@/actions/reports";
import { Role } from "@/db/schema";
import { useEffect, useState } from "react";
import type { ReportContent, ReportFormData, TableData } from "./report-form";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  address: string;
  height: number;
  weight: number;
  sex: string;
  bloodType: string;
  birthDate: string;
  createdAt: Date;
  imageUrl?: string | null;
}

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  userId: string;
  roleId: string;
  imageId?: string;
  licenseNo?: string;
}

interface Sample {
  id: string;
  patientId: string;
  sampleName: string | null;
  createdBy: string;
  uploadedBy: string | null;
  metadata: unknown;
  capturedAt: Date | null;
  imageId: string | null;
  imageUrl: string | null;
  createdByName?: string;
}

interface CreateReportFormProps {
  patients: Patient[];
  currentUserId: string;
  profiles: Profile[];
  role: Role;
}

export default function CreateReportForm({ patients, currentUserId, profiles, role }: CreateReportFormProps) {
  console.log("CreateReportForm rendered");
  
  const [initialReportContent, setInitialReportContent] = useState<ReportContent | undefined>(undefined);
  const [initialFormData, setInitialFormData] = useState<ReportFormData | undefined>(undefined);
  const [initialPatientId, setInitialPatientId] = useState<string | undefined>(undefined);
  const [initialSampleId, setInitialSampleId] = useState<string | undefined>(undefined);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    console.log("CreateReportForm useEffect running");
    
    // Only run on client
    if (typeof window !== "undefined") {
      try {
        const batchDataRaw = localStorage.getItem("batchDetectionReportData");
        console.log("Raw localStorage data:", batchDataRaw);
        
        if (batchDataRaw) {
          const batchData = JSON.parse(batchDataRaw);
          console.log("Parsed batchDetectionReportData:", batchData);
          
          // Prefill report content and form data from batch detection
          const detectionResults = batchData.detectionResults;
          const aiAnalysis = batchData.aiAnalysis;

          console.log("Detection results:", detectionResults);
          console.log("AI analysis:", aiAnalysis);

          // Build tables from detectionResults
          let tables: TableData[] = [];
          if (detectionResults && detectionResults.detections) {
            tables.push({
              id: "detections-table",
              title: "Detection Summary",
              headers: ["Object", "Count"],
              rows: Object.entries(detectionResults.detections).map(([cls, count]) => [
                cls.replace("_", " "),
                String(count)
              ]),
            });
          }

          // Prefill text from AI analysis
          let text = "";
          if (aiAnalysis && aiAnalysis.success && aiAnalysis.analysis) {
            text = aiAnalysis.analysis;
          }

          const reportContent = { text, tables };
          const formData = {
            title: "Batch Detection Report",
            testType: "Microscopy",
            content: text,
            isAiGenerated: true,
          };

          console.log("Setting initial report content:", reportContent);
          console.log("Setting initial form data:", formData);
          console.log("Setting initial patient ID:", batchData.patientId);
          console.log("Setting initial sample ID:", batchData.sampleId);

          setInitialReportContent(reportContent);
          setInitialFormData(formData);
          
          // Set patient and sample if present
          if (batchData.patientId) setInitialPatientId(batchData.patientId);
          if (batchData.sampleId) setInitialSampleId(batchData.sampleId);

          // Clear localStorage after processing
          localStorage.removeItem("batchDetectionReportData");
        } else {
          console.log("No batchDetectionReportData found in localStorage");
        }
      } catch (e) {
        console.error("Error parsing localStorage data:", e);
      } finally {
        // Always set data as loaded, whether we found data or not
        setIsDataLoaded(true);
      }
    }
  }, []);

  // Don't render the form until we've checked localStorage
  if (!isDataLoaded) {
    return <div>Loading...</div>;
  }

  console.log("Rendering ImprovedReportForm with:", {
    initialReportContent,
    initialFormData,
    initialPatientId,
    initialSampleId
  });

  return (
    <ImprovedReportForm
      mode="create"
      onSubmit={addReport}
      patients={patients}
      profiles={profiles}
      role={role}
      currentUserId={currentUserId}
      initialReportContent={initialReportContent}
      initialFormData={initialFormData}
      initialPatientId={initialPatientId}
      initialSampleId={initialSampleId}
    />
  );
}