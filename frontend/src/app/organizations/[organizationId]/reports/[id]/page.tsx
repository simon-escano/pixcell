import Base from "@/components/base"
import ImprovedReportPreview from "@/components/reports/report-preview"
import StatusBadge from "@/components/reports/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getPatientById, getProfileByUserId, getReportById, getRoleByUserIdAndOrganizationId, getSampleById, getOrganizationById } from "@/db/queries/select"
import { format } from "date-fns"
import { ArrowLeft, Sparkles, XCircle } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import AiGeneratedNoticeClient from "./ai-generated-notice-client"
import ReportActions, { ReportActionButtons } from "./report-actions-client"
import { ReportStatus } from "@/lib/status-config"
import { Metadata } from "next"
import AccessDeniedPage from "@/components/access-denied-page"

function truncate(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string | string[]; organizationId: string }>;
}): Promise<Metadata> {
  const paramsObj = await params;
  const reportId = Array.isArray(paramsObj.id) ? paramsObj.id[0] : (paramsObj.id ?? "");
  const report = await getReportById(reportId);
  
  const title = report?.title 
    ? truncate(report.title)
    : "Report";
  
  return {
    title: `PixCell | ${title}`,
  };
}

// Loading component
function ReportPageSkeleton() {
  return (
    <Base>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-8 py-8">
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
function ReportNotFound({ organizationId }: { organizationId?: string }) {
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
                <p className="text-muted-foreground mt-1">
                  The report you're looking for doesn't exist or has been removed.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" asChild>
                  <Link href={organizationId ? `/organizations/${organizationId}/reports` : `/reports`}>
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

// AI Generated badge component
function AiGeneratedBadge() {
  return (
    <Badge
      variant="outline"
      className="bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border-purple-200 dark:from-purple-950 dark:to-blue-950 dark:text-purple-300 dark:border-purple-800 border flex items-center font-medium shadow-sm"
    >
      <Sparkles className="size-4 text-purple-600 dark:text-purple-400" />
      AI Generated
    </Badge>
  )
}

// Main component
export default async function ImprovedReportPage({ params }: { params: Promise<{ id: string | string[], organizationId: string }> }) {
  const paramsObj = await params;
  const { id } = paramsObj;
  const organizationId = paramsObj.organizationId;
  const reportId = Array.isArray(id) ? id[0] : (id ?? "")

  const report = await getReportById(reportId)

  if (!report) {
    return <ReportNotFound organizationId={organizationId} />
  }

  // Check if report belongs to the organization
  if (report.organizationId !== organizationId) {
    return (
      <Base params={paramsObj}>
        <AccessDeniedPage 
          message="This report does not exist in this organization."
          backUrl={`/organizations/${organizationId}/reports`}
          backLabel="Back to Reports"
        />
      </Base>
    )
  }

  const patient = report.patientId ? await getPatientById(report.patientId) : null
  const sample = report.sampleId ? await getSampleById(report.sampleId) : null

  let doctor = null,
    role = null
  if (sample?.createdBy && organizationId) {
    doctor = await getProfileByUserId(sample.createdBy)
    if (doctor) role = await getRoleByUserIdAndOrganizationId(sample.createdBy, organizationId)
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

  // Fetch organization data
  const org = await getOrganizationById(organizationId)

  return (
    <Base params={paramsObj}>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            {/* Title and Actions */}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
              <div className="flex flex-col gap-3">
                <h1 className="text-3xl font-semibold text-foreground">{report.title || "Medical Report"}</h1>
                <div className="flex flex-wrap items-center gap-4">
                  {report.isAiGenerated && <AiGeneratedBadge />}
                  <p className="text-muted-foreground">
                    {report.testType} • Created{" "}
                    {report.createdAt ? format(new Date(report.createdAt), "MMM dd, yyyy") : "Unknown"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <ReportActionButtons reportId={reportId} formData={formData} organizationId={organizationId} reportStatus={report.status || "Draft"} reportCode={report.code ?? ""} />
                  </div>
                </div>
              </div>
              <Button variant="ghost" asChild>
                <Link href={`/organizations/${organizationId}/reports`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Reports
                </Link>
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-wrap">
            {/* Main Preview */}
            <div className="flex-1 flex justify-center">
              <div className="w-full max-w-3xl">
                <Suspense fallback={<div className="h-96 bg-muted rounded-lg animate-pulse" />}>
                  <ImprovedReportPreview
                    formData={formData}
                    reportContent={reportContent}
                    selectedPatient={
                      patient
                        ? {
                            ...patient,
                            fullName: `${patient.firstName} ${patient.lastName}`,
                            role: "Patient",
                            createdBy: patient.id,
                          }
                        : undefined
                    }
                    selectedSample={sample ? { ...sample, createdByName: doctorName } : undefined}
                    doctorName={doctorName}
                    doctorRole={doctorRole}
                    doctorLicense={doctorLicense}
                    organization={org}
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
                  organizationId={organizationId}
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
              {report.isAiGenerated && <AiGeneratedNoticeClient />}
            </div>
          </div>
        </div>
      </div>
    </Base>
  )
}

// Export with Suspense wrapper for better loading experience
export function ReportPageWithSuspense({ params }: { params: Promise<{ id: string | string[]; organizationId: string }> }) {
  return (
    <Suspense fallback={<ReportPageSkeleton />}>
      <ImprovedReportPage params={params} />
    </Suspense>
  )
}
