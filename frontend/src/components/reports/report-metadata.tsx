"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FileText,
  AlertCircle,
  Shield,
  Clock,
  User,
  TestTube,
  Building,
  ArrowLeft,
  PrinterIcon as Print,
  Share2,
  XCircle,
  CheckCircle2,
  Eye,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

function StatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Draft":
        return { color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock }
      case "Finalized":
        return { color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 }
      case "UNDER_REVIEW":
        return { color: "bg-blue-50 text-blue-700 border-blue-200", icon: Eye }
      case "REJECTED":
        return { color: "bg-red-50 text-red-700 border-red-200", icon: XCircle }
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

export default function ReportMetadata({ reportData }: { reportData: any }) {
  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: reportData.formData.title,
          text: `Medical Report: ${reportData.formData.title}`,
          url: window.location.href,
        })
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href)
        alert("Report link copied to clipboard!")
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert("Report link copied to clipboard!")
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="w-full flex items-center gap-2 bg-transparent"
          >
            <Print className="h-4 w-4" />
            Print Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="w-full flex items-center gap-2 bg-transparent"
          >
            <Share2 className="h-4 w-4" />
            Share Report
          </Button>
          <Button variant="outline" size="sm" asChild className="w-full flex items-center gap-2 bg-transparent">
            <Link href="/reports/view">
              <ArrowLeft className="h-4 w-4" />
              View Another Report
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Report Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <StatusBadge status={reportData.formData.status || "Finalized"} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Test Type</span>
              <span className="text-sm text-foreground">{reportData.formData.testType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Report Code</span>
              <span className="text-sm font-mono bg-muted text-muted-foreground px-2 py-1 rounded">
                {reportData.reportCode || "N/A"}
              </span>
            </div>
            {reportData.formData.createdAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Created</span>
                <span className="text-sm text-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(reportData.formData.createdAt), "MMM dd, yyyy")}
                </span>
              </div>
            )}
          </div>

          {/* Patient Info */}
          {reportData.selectedPatient && (
            <>
              <div className="border-t border-border pt-4">
                <h4 className="font-medium text-foreground flex items-center gap-2 mb-3">
                  <User className="h-4 w-4" />
                  Patient Information
                </h4>
                <div className="space-y-2 pl-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Name</span>
                    <span className="text-sm text-foreground">
                      {reportData.selectedPatient.firstName} {reportData.selectedPatient.lastName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Blood Type</span>
                    <span className="text-sm text-foreground">{reportData.selectedPatient.bloodType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Sex</span>
                    <span className="text-sm text-foreground">{reportData.selectedPatient.sex}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Sample Info */}
          {reportData.selectedSample && (
            <>
              <div className="border-t border-border pt-4">
                <h4 className="font-medium text-foreground flex items-center gap-2 mb-3">
                  <TestTube className="h-4 w-4" />
                  Sample Information
                </h4>
                <div className="space-y-2 pl-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Sample Name</span>
                    <span className="text-sm text-foreground">
                      {reportData.selectedSample.sampleName || `Sample ${reportData.selectedSample.id?.slice(0, 8)}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Created By</span>
                    <span className="text-sm text-foreground">{reportData.doctorName}</span>
                  </div>
                  {reportData.selectedSample.capturedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Captured</span>
                      <span className="text-sm text-foreground">
                        {format(new Date(reportData.selectedSample.capturedAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Healthcare Provider Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <div className="mx-auto w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">PixCell</h4>
              <p className="text-sm text-muted-foreground">123 Medical Center Dr.</p>
              <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
