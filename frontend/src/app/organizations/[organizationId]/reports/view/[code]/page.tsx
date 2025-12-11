import PixCellLogo from "@/components/pixcell-logo"
import PublicHeader from "@/components/reports/public-header"
import ReportMetadata from "@/components/reports/report-metadata"
import ReportNotFound from "@/components/reports/report-not-found"
import ImprovedReportPreview from "@/components/reports/report-preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  Shield,
  TestTube,
  User,
  XCircle
} from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import { Metadata } from "next"
import { getReportByCode } from "@/db/queries/select"

function truncate(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string; organizationId?: string }>;
}): Promise<Metadata> {
  const paramsObj = await params;
  const report = await getReportByCode(paramsObj.code);
  
  const title = report?.title 
    ? truncate(report.title)
    : "Report";
  
  return {
    title: `PixCell | ${title}`,
  };
}

// Loading component
function ReportViewSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Public Header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">

              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">PixCell</h1>
                <p className="text-xs text-muted-foreground">Secure Report Access</p>
              </div>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Public Access
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
        </div>
        {/* Content Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          <div className="xl:col-span-4">
            <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <div className="xl:col-span-1 space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Theme toggle component
// REMOVE: const ThemeToggle = dynamic(() => import("@/components/theme-toggle"), { ssr: false })

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

// Report Header Component
function ReportHeader({ reportData, code, organizationId }: { reportData: any; code: string; organizationId?: string }) {
  const orgHref = organizationId ? `/organizations/${organizationId}/reports/view` : `/reports/view`
  return (
    <div className="mb-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href={orgHref} className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" />
          Report Access
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {reportData.formData.title || `Report ${code.slice(0, 8).toUpperCase()}`}
        </span>
      </nav>
      {/* Title Section */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              {reportData.formData.title || "Medical Report"}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <TestTube className="h-4 w-4" />
                {reportData.formData.testType}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Accessed {format(new Date(), "MMM dd, yyyy 'at' HH:mm")}
              </span>
              {reportData.selectedPatient && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {reportData.selectedPatient.firstName} {reportData.selectedPatient.lastName}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <StatusBadge status={reportData.formData.status || "Finalized"} />
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Secure Access
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main component
export default async function ImprovedReportViewByCodePage({ params }: { params: { code: string; organizationId?: string } }) {
  const { code, organizationId } = params
  const baseUrl = "http://localhost:3000"

  try {
    const res = await fetch(`${baseUrl}/api/reports/by-code?code=${encodeURIComponent(code)}`, {
      cache: "no-store",
    })

    if (!res.ok) {
      return <ReportNotFound code={code} />
    }

    const reportData = await res.json()

    // Remove redirect logic. Just display the report for the code directly.
    if (!reportData || !reportData.formData) {
      return <ReportNotFound code={code} />
    }

    return (
      <div className="min-h-screen bg-[var(--background)] relative">
        {/* Public Header */}
        <PublicHeader code={code} />
        <div className="container mx-auto p-8">
          {/* Report Header */}
          <ReportHeader reportData={reportData} code={code} organizationId={organizationId} />
          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            {/* Main Report Preview - Takes up more space */}
            <div className="xl:col-span-4">
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] shadow-sm overflow-hidden">
                <Suspense fallback={<div className="h-96 bg-[var(--muted)] rounded-lg animate-pulse" />}>
                  <ImprovedReportPreview
                    formData={reportData.formData}
                    reportContent={reportData.reportContent}
                    selectedPatient={reportData.selectedPatient}
                    selectedSample={reportData.selectedSample}
                    doctorName={reportData.doctorName}
                    doctorRole={reportData.doctorRole}
                    doctorLicense={reportData.doctorLicense}
                  />
                </Suspense>
              </div>
            </div>
            {/* Sidebar - Compact and organized */}
            <div className="xl:col-span-1">
              <div className="sticky top-24 space-y-6">
                <Suspense fallback={<div className="h-32 bg-[var(--muted)] rounded-lg animate-pulse" />}>
                  <ReportMetadata reportData={reportData} />
                </Suspense>
              </div>
            </div>
          </div>
          {/* Footer Section */}
          <div className="mt-12 pt-8 border-t border-[var(--border)]">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <PixCellLogo className="size-8" />
                  <div>
                    <h3 className="font-medium text-[var(--foreground)]">PixCell</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">123 Medical Center Dr. • +1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    HIPAA Compliant
                  </Badge>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={organizationId ? `/organizations/${organizationId}/reports/view` : `/reports/view`}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Access Another Report
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {/* Security Notice */}
          <div className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[var(--primary)/10] rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 text-[var(--primary)]" />
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)]">
                    <p className="font-medium text-[var(--foreground)] mb-1">Secure Access Notice</p>
                    <p>
                      This medical report is accessed through a secure, encrypted connection. All viewing activity is
                      logged for security and compliance purposes. This report contains confidential medical information
                      and should only be viewed by authorized individuals.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    return <ReportNotFound code={code} />
  }
}

// Export with Suspense wrapper for better loading experience
export function ReportViewByCodePageWithSuspense({ params }: { params: { code: string } }) {
  return (
    <Suspense fallback={<ReportViewSkeleton />}>
      <ImprovedReportViewByCodePage params={params} />
    </Suspense>
  )
}
