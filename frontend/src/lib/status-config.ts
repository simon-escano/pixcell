import { Clock, CheckCircle2, Eye, AlertTriangle, Shield, FileText } from "lucide-react"

export type ReportStatus = "Draft" | "Finalized" | "Under Review" | "Rejected" | "Archived"

export const getStatusConfig = (status: ReportStatus) => {
  switch (status) {
    case "Draft":
      return {
        color: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700",
        icon: Clock,
        description: "Report is in draft mode and can be edited",
        label: "Draft",
      }
    case "Finalized":
      return {
        color: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700",
        icon: CheckCircle2,
        description: "Report has been finalized and is ready for sharing",
        label: "Finalized",
      }
    case "Under Review":
      return {
        color: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700",
        icon: Eye,
        description: "Report is currently under review",
        label: "Under Review",
      }
    case "Rejected":
      return {
        color: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700",
        icon: AlertTriangle,
        description: "Report has been rejected and needs revision",
        label: "Rejected",
      }
    case "Archived":
      return {
        color: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700",
        icon: Shield,
        description: "Report has been archived",
        label: "Archived",
      }
    default:
      return {
        color: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700",
        icon: FileText,
        description: "Unknown status",
        label: "Unknown",
      }
  }
}

export const ALL_STATUSES: ReportStatus[] = ["Draft", "Finalized", "Under Review", "Rejected", "Archived"]
