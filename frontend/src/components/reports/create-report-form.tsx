"use client"
import ImprovedReportForm from "./report-form"
import { addReport } from "@/actions/reports"
import type { Role } from "@/db/schema"
import { useEffect, useState } from "react"
import type { ReportContent, ReportFormData, TableData } from "./report-form"
import { MetaPatient } from "@/app/organizations/[organizationId]/samples/types"

interface Patient {
  id: string
  firstName: string
  lastName: string
  email: string
  contactNumber: string
  address: string
  height: number
  weight: number
  sex: string
  bloodType: string
  birthDate: string
  createdAt: Date
  imageUrl?: string | null
}

interface Profile {
  id: string
  firstName: string
  lastName: string
  userId: string
  roleId: string
  imageId?: string
  licenseNo?: string
}

interface Sample {
  id: string
  patientId: string
  sampleName: string | null
  createdBy: string
  uploadedBy: string | null
  metadata: unknown
  capturedAt: Date | null
  imageId: string | null
  imageUrl: string | null
  createdByName?: string
}

interface CreateReportFormProps {
  patients: MetaPatient[]
  currentUserId: string
  profiles: Profile[]
  role: Role
}

export default function CreateReportForm({ patients, currentUserId, profiles, role }: CreateReportFormProps) {
  console.log("CreateReportForm rendered")

  const [initialReportContent, setInitialReportContent] = useState<ReportContent | undefined>(undefined)
  const [initialFormData, setInitialFormData] = useState<ReportFormData | undefined>(undefined)
  const [initialPatientId, setInitialPatientId] = useState<string | undefined>(undefined)
  const [initialSampleId, setInitialSampleId] = useState<string | undefined>(undefined)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  useEffect(() => {
    console.log("CreateReportForm useEffect running")

    // Only run on client
    if (typeof window !== "undefined") {
      try {
        const batchDataRaw = localStorage.getItem("batchDetectionReportData")
        console.log("Raw localStorage data:", batchDataRaw)

        if (batchDataRaw) {
          const batchData = JSON.parse(batchDataRaw)
          console.log("Parsed batchDetectionReportData:", batchData)

          // Prefill report content and form data from batch detection
          const detectionResults = batchData.detectionResults
          const aiAnalysis = batchData.aiAnalysis
          console.log("Detection results:", detectionResults)
          console.log("AI analysis:", aiAnalysis)

          // Build tables from detectionResults
          const tables: TableData[] = []
          if (detectionResults && detectionResults.detections) {
            // Create detection summary table
            const detectionEntries = Object.entries(detectionResults.detections)
            tables.push({
              id: "detections-summary-table",
              title: "Detection Summary",
              headers: ["Object Type", "Count", "Percentage", "Notes"],
              rows: detectionEntries.map(([cls, count]) => {
                const percentage = detectionResults.total_detections
                  ? ((Number(count) / detectionResults.total_detections) * 100).toFixed(1) + "%"
                  : "0%"
                return [
                  cls
                    .replace("_", " ")
                    .replace(/\b\w/g, (l: string) => l.toUpperCase()), // Capitalize each word
                  String(count),
                  percentage,
                  "", // Empty notes column for user to fill
                ]
              }),
            })

            // If there are multiple images, create a per-image breakdown table
            if (detectionResults.per_image && detectionResults.per_image.length > 1) {
              const imageHeaders = [
                "Image",
                "Total Detections",
                ...detectionEntries.map(([cls]) =>
                  cls.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
                ),
              ]

              const imageRows = detectionResults.per_image.map((img: any, index: number) => {
                const row = [`Image ${index + 1}`, String(img.total_detections || 0)]

                // Add count for each detection type
                detectionEntries.forEach(([cls]) => {
                  row.push(String(img.detections?.[cls] || 0))
                })

                return row
              })

              tables.push({
                id: "per-image-detections-table",
                title: "Per-Image Detection Breakdown",
                headers: imageHeaders,
                rows: imageRows,
              })
            }

            // Create a findings interpretation table
            tables.push({
              id: "findings-interpretation-table",
              title: "Clinical Findings & Interpretation",
              headers: ["Finding", "Clinical Significance", "Recommendation"],
              rows: detectionEntries.map(([cls, count]) => [
                cls.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
                "", // Empty for user to fill
                "", // Empty for user to fill
              ]),
            })
          }

          // Prefill text from AI analysis
          let text = ""
          if (aiAnalysis && aiAnalysis.success && aiAnalysis.analysis) {
            text = aiAnalysis.analysis
          }

          const reportContent = { text, tables }
          const formData = {
            title: `AI Detection Analysis Report - ${new Date().toLocaleDateString()}`,
            testType: "Microscopy",
            content: text,
            isAiGenerated: true,
            customTestType: "",
          }

          console.log("Setting initial report content:", reportContent)
          console.log("Setting initial form data:", formData)
          console.log("Setting initial patient ID:", batchData.patientId)
          console.log("Setting initial sample ID:", batchData.sampleId)

          setInitialReportContent(reportContent)
          setInitialFormData(formData)

          // Set patient and sample if present
          if (batchData.patientId) setInitialPatientId(batchData.patientId)
          if (batchData.sampleId) setInitialSampleId(batchData.sampleId)

          // Clear localStorage after processing
          localStorage.removeItem("batchDetectionReportData")
        } else {
          console.log("No batchDetectionReportData found in localStorage")
        }
      } catch (e) {
        console.error("Error parsing localStorage data:", e)
      } finally {
        // Always set data as loaded, whether we found data or not
        setIsDataLoaded(true)
      }
    }
  }, [])

  // Don't render the form until we've checked localStorage
  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading report data...</p>
        </div>
      </div>
    )
  }

  console.log("Rendering ImprovedReportForm with:", {
    initialReportContent,
    initialFormData,
    initialPatientId,
    initialSampleId,
  })

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
  )
}
