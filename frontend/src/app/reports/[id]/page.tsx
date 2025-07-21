import { Suspense } from "react"
import { getReportById, getPatientById, getSampleById, getProfileByUserId, getRoleById } from "@/db/queries/select"
import Base from "@/components/base"
import ImprovedReportPreview from "@/components/reports/report-preview"
import ReportActions from "./report-actions-client"
import type { ReportStatus } from "@/components/reports/status-update"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CustomAlertDialog } from "@/components/custom-alert-dialog"
import {
  ArrowLeft,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import AiGeneratedNoticeClient from "./ai-generated-notice-client"

// Loading component
function ReportPageSkeleton() {
  return (
    <Base>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse" />
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <div className="h-96 bg-muted rounded-lg animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded-lg animate-pulse" />
              <div className="h-48 bg-muted rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </Base>
  )
}

// Error component
function ReportNotFound() {
  return (
    <Base>
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Report Not Found</h3>
                <p className="text-muted-foreground mt-1">The report you're looking for doesn't exist or has been removed.</p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" asChild>
                  <Link href="/reports">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Reports
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Base>
  )
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Draft":
        return { color: "bg-muted text-muted-foreground border-border", icon: Clock }
      case "Finalized":
        return { color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800", icon: CheckCircle2 }
      case "UNDER_REVIEW":
        return { color: "bg-accent text-accent-foreground border-accent", icon: Eye }
      case "REJECTED":
        return { color: "bg-destructive/10 text-destructive border-destructive", icon: XCircle }
      case "ARCHIVED":
        return { color: "bg-muted text-muted-foreground border-border", icon: Shield }
      default:
        return { color: "bg-muted text-muted-foreground border-border", icon: AlertCircle }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <Badge variant="outline" className={`${config.color} border flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {status.replace("_", " ")}
    </Badge>
  )
}

// Main component
export default async function ImprovedReportPage({ params }: { params: Promise<{ id: string | string[] }> }) {
  const { id } = await params
  const reportId = Array.isArray(id) ? id[0] : (id ?? "")

  const report = await getReportById(reportId)

  if (!report) {
    return <ReportNotFound />
  }

  const patient = report.patientId ? await getPatientById(report.patientId) : null
  const sample = report.sampleId ? await getSampleById(report.sampleId) : null

  let doctor = null,
    role = null
  if (sample?.createdBy) {
    doctor = await getProfileByUserId(sample.createdBy)
    if (doctor?.roleId) role = await getRoleById(doctor.roleId)
  }

  // Ensure content is always an object with string text and array tables
  const contentObj =
    typeof report.content === "object" && report.content !== null ? (report.content as any) : { text: "", tables: [] }

  const formData = {
    title: report.title || "",
    testType: report.testType || "",
    content: typeof contentObj.text === "string" ? contentObj.text : "",
    isAiGenerated: report.isAiGenerated || false,
  }

  const reportContent = {
    text: typeof contentObj.text === "string" ? contentObj.text : "",
    tables: Array.isArray(contentObj.tables) ? contentObj.tables : [],
  }

  const doctorName = doctor ? `${doctor.firstName} ${doctor.lastName}` : "N/A"
  const doctorRole = role && role.id && role.name ? role : { id: "unknown", name: "Doctor" }
  const doctorLicense = doctor && "licenseNo" in doctor && (doctor as any).licenseNo ? (doctor as any).licenseNo : "N/A"

  return (
    <Base>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            {/* Title and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{report.title || "Medical Report"}</h1>
                <p className="text-muted-foreground mt-1">
                  {report.testType} • Created{" "}
                  {report.createdAt ? format(new Date(report.createdAt), "MMM dd, yyyy") : "Unknown"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={report.status || "Draft"} />
                <Button variant="outline" asChild>
                  <Link href="/reports">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Reports
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Preview */}
            <div className="lg:col-span-3 flex justify-center">
              <div className="w-full max-w-3xl">
                <Suspense fallback={<div className="h-96 bg-muted rounded-lg animate-pulse" />}>
                  <ImprovedReportPreview
                    formData={formData}
                    reportContent={reportContent}
                    selectedPatient={patient ?? undefined}
                    selectedSample={sample ? { ...sample, createdByName: doctorName } : undefined}
                    doctorName={doctorName}
                    doctorRole={doctorRole}
                    doctorLicense={doctorLicense}
                  />
                </Suspense>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6 max-w-lg mx-auto">
              {/* Report Actions */}
              <Suspense fallback={<div className="h-32 bg-muted rounded-lg animate-pulse" />}>
                <ReportActions
                  reportId={reportId}
                  reportStatus={
                    ["Draft", "Finalized", "UNDER_REVIEW", "REJECTED", "ARCHIVED"].includes(report.status ?? "")
                      ? (report.status as ReportStatus)
                      : "Draft"
                  }
                  formData={formData}
                  reportCode={report.code ?? ""}
                  patient={patient}
                  sample={sample}
                  doctorName={doctorName}
                />
              </Suspense>

              {/* AI Generated Notice */}
              {report.isAiGenerated && (
                <AiGeneratedNoticeClient />
              )}
            </div>
          </div>
        </div>
      </div>
    </Base>
  )
}

// Export with Suspense wrapper for better loading experience
export function ReportPageWithSuspense({ params }: { params: Promise<{ id: string | string[] }> }) {
  return (
    <Suspense fallback={<ReportPageSkeleton />}>
      <ImprovedReportPage params={params} />
    </Suspense>
  )
}
