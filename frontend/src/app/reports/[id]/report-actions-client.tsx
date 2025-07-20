"use client"

import dynamic from "next/dynamic"
const QRCode = dynamic(() => import("react-qr-code"), { ssr: false })

import { useRouter } from "next/navigation"
import { useTransition, useState } from "react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CustomAlertDialog } from "@/components/custom-alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { deleteReport } from "@/actions/reports"
import {
  FileText,
  Edit,
  Trash2,
  QrCode,
  Copy,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Shield,
  ExternalLink,
  Loader2,
  User,
  TestTube,
} from "lucide-react"
import StatusUpdate, { type ReportStatus } from "@/components/reports/status-update"

interface ReportActionsProps {
  reportId: string
  formData: any
  reportStatus: ReportStatus
  reportCode: string
  patient?: any // Add patient prop
  sample?: any // Add sample prop
  doctorName?: string // Add doctorName prop
}

// Status configuration
const getStatusConfig = (status: ReportStatus) => {
  switch (status) {
    case "Draft":
      return {
        color: "bg-muted text-muted-foreground border-border",
        icon: Clock,
        description: "Report is in draft mode and can be edited",
      }
    case "Finalized":
      return {
        color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800",
        icon: CheckCircle2,
        description: "Report has been finalized and is ready for sharing",
      }
    case "UNDER_REVIEW":
      return {
        color: "bg-accent text-accent-foreground border-accent",
        icon: Eye,
        description: "Report is currently under review",
      }
    case "REJECTED":
      return {
        color: "bg-destructive/10 text-destructive border-destructive",
        icon: AlertTriangle,
        description: "Report has been rejected and needs revision",
      }
    case "ARCHIVED":
      return {
        color: "bg-muted text-muted-foreground border-border",
        icon: Shield,
        description: "Report has been archived",
      }
    default:
      return {
        color: "bg-muted text-muted-foreground border-border",
        icon: FileText,
        description: "Unknown status",
      }
  }
}

export default function ImprovedReportActions({
  reportId,
  formData,
  reportStatus,
  reportCode,
  patient,
  sample,
  doctorName,
}: ReportActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDownloadingQR, setIsDownloadingQR] = useState(false)
  const [isCopyingLink, setIsCopyingLink] = useState(false)

  // The URL to view the report (for QR code)
  const reportUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/reports/view/${reportCode}`
  const qrContainerId = `qr-container-${reportId}`

  const statusConfig = getStatusConfig(reportStatus)
  const StatusIcon = statusConfig.icon

  const handleEdit = () => {
    router.push(`/reports/${reportId}/edit`)
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    setShowDeleteDialog(false)
    startTransition(async () => {
      try {
        const res = await deleteReport(reportId)
        if (res.success) {
          toast.success("Report deleted successfully")
          router.push("/reports")
          router.refresh()
        } else {
          toast.error(res.error || "Failed to delete report")
        }
      } catch (error) {
        toast.error("An error occurred while deleting the report")
      }
    })
  }

  const handleCopyQr = async () => {
    setIsCopyingLink(true)
    try {
      await navigator.clipboard.writeText(reportUrl)
      toast.success("Report link copied to clipboard!")
    } catch (error) {
      toast.error("Failed to copy link")
    } finally {
      setIsCopyingLink(false)
    }
  }

  const handleDownloadQr = async () => {
    setIsDownloadingQR(true)
    try {
      const el = document.getElementById(qrContainerId)
      if (!el) {
        toast.error("QR code not found")
        return
      }

      const svg = el.querySelector("svg")
      if (!svg) {
        toast.error("QR code not generated yet")
        return
      }

      // Create a canvas to convert SVG to PNG
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      const serializer = new XMLSerializer()
      const source = serializer.serializeToString(svg)
      const svg64 = btoa(unescape(encodeURIComponent(source)))
      const image64 = `data:image/svg+xml;base64,${svg64}`

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `report-${reportCode}-qr.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            toast.success("QR code downloaded successfully!")
          }
        }, "image/png")
      }

      img.src = image64
    } catch (error) {
      toast.error("Failed to download QR code")
    } finally {
      setIsDownloadingQR(false)
    }
  }

  const handleStatusUpdated = async (newStatus: ReportStatus) => {
    router.refresh()
    toast.success("Report status updated successfully")
  }

  const handleViewReport = () => {
    window.open(reportUrl, "_blank")
  }

  return (
    <div className="space-y-6">
      {/* QR Code Card - Only show for finalized reports */}
      {reportStatus === "Finalized" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Share Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-3">
              <div className="bg-card p-4 rounded-lg border shadow-sm" id={qrContainerId}>
                <QRCode value={reportUrl} size={120} level="M" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Report Code: {reportCode}</p>
                <p className="text-xs text-muted-foreground mt-1">Scan QR code to view report</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyQr}
                disabled={isCopyingLink}
                className="flex items-center gap-2 bg-transparent"
              >
                {isCopyingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                Copy Link
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadQr}
                disabled={isDownloadingQR}
                className="flex items-center gap-2 bg-transparent"
              >
                {isDownloadingQR ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download
              </Button>
            </div>

            <Button size="sm" variant="secondary" onClick={handleViewReport} className="w-full flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              View Public Report
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Report Actions Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant="outline" className={`${statusConfig.color} border flex items-center gap-1`}>
                <StatusIcon className="h-3 w-3" />
                {reportStatus.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{statusConfig.description}</p>
            <StatusUpdate reportId={reportId} currentStatus={reportStatus} onUpdate={handleStatusUpdated} />
          </div>

          <Separator />

          {/* Edit Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="w-full flex items-center gap-2 justify-start bg-transparent"
            disabled={reportStatus === "ARCHIVED"}
          >
            <Edit className="h-4 w-4" />
            Edit Report
          </Button>

          <Separator />

          {/* Danger Zone */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Danger Zone</p>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
              className="w-full flex items-center gap-2 justify-start"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Information Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Report Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Report ID</span>
              <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {reportCode || reportId?.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Test Type</span>
              <span className="text-sm text-foreground">{formData.testType}</span>
            </div>
            {formData.createdAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Created</span>
                <span className="text-sm text-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(formData.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {formData.updatedAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
                <span className="text-sm text-foreground">
                  {new Date(formData.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Patient Info */}
          {typeof patient === "object" && patient && (
            <>
              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Patient Information
                </h4>
                <div className="space-y-2 pl-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Name</span>
                    <span className="text-sm text-foreground">
                      {patient.firstName} {patient.lastName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Email</span>
                    <span className="text-sm text-foreground">{patient.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Blood Type</span>
                    <span className="text-sm text-foreground">{patient.bloodType}</span>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Sample Info */}
          {typeof sample === "object" && sample && (
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Sample Information
              </h4>
              <div className="space-y-2 pl-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Sample Name</span>
                  <span className="text-sm text-foreground">
                    {sample.sampleName || `Sample ${sample.id?.slice(0, 8)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Created By</span>
                  <span className="text-sm text-foreground">{doctorName}</span>
                </div>
                {sample.capturedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Captured</span>
                    <span className="text-sm text-foreground">
                      {new Date(sample.capturedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Generated Warning */}
      {formData.isAiGenerated && (
        <CustomAlertDialog
          title={
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              AI Generated Report
            </span>
          }
          description="This report was generated using AI assistance. Please review all content carefully before finalizing."
          onConfirm={async () => {}}
          confirmText="OK"
          cancelText=""
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Report
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this report? This action cannot be undone and will permanently remove:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Report content and data</li>
              <li>• Associated QR codes and links</li>
              <li>• All report history</li>
            </ul>

            <CustomAlertDialog
              title={
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Warning
                </span>
              }
              description="This action is permanent and cannot be reversed."
              onConfirm={confirmDelete}
              confirmText="Delete Report"
              cancelText="Cancel"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
