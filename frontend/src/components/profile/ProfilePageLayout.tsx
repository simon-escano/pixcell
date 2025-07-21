"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileText,
  TestTube,
  User,
  Calendar,
  Activity,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Users,
  BarChart3,
  Search,
  Plus,
  Clock,
  Download,
  ArrowUpDown,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react"
import UserButton from "../users/user-button";

export interface ProfilePageLayoutProps {
  entity: any // user or patient
  samples: any[]
  reports: any[]
  metaEntity?: any
  editDialogTrigger: ReactNode
  details: ReactNode // extra details (fields)
  actions?: ReactNode // action buttons (optional)
  sampleList?: ReactNode // custom sample list (optional)
  reportList: ReactNode // report list (required)
  reportCount?: number // for patients
  patientsList?: ReactNode // for users with patients
  patientsCount?: number // for users with patients
  patients?: any[]; // <-- add this
}

// Enhanced Empty State Component
const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  gradient,
}: {
  icon: any
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  gradient: string
}) => (
  <div className="flex flex-col items-center justify-center h-full text-center py-12">
    <div className={`w-20 h-20 ${gradient} rounded-full flex items-center justify-center mb-6 shadow-lg`}>
      <Icon className="h-10 w-10 text-white" />
    </div>
    <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
    <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">{description}</p>
    {actionLabel && onAction && (
      <Button
        onClick={onAction}
        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
      >
        <Plus className="w-4 h-4 mr-2" />
        {actionLabel}
      </Button>
    )}
    <div className="flex items-center gap-2 text-sm text-primary mt-4">
      <Sparkles className="w-4 h-4" />
      Ready when you are
    </div>
  </div>
)

// Enhanced Sample Item Component
const SampleItem = ({ sample, index, onClick }: { sample: any; index: number; onClick: () => void }) => {

  return (
    <button
      onClick={onClick}
      className="group flex items-center justify-between p-4 bg-gradient-to-r from-card to-muted/30 hover:from-muted/50 hover:to-accent/30 dark:from-card dark:to-muted/20 dark:hover:from-muted/30 dark:hover:to-accent/20 rounded-xl transition-all duration-300 border-2 border-border/30 hover:border-primary/30 dark:border-border/20 dark:hover:border-primary/40 w-full text-left shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-4">
        <div className="w-2 h-12 bg-gradient-to-b from-primary to-primary/70 rounded-full shadow-sm"></div>
        <div className="flex-1">
          <div className="font-semibold text-foreground text-base flex items-center gap-2 mb-1">
            {sample.sampleName || `Sample #${String(index + 1).padStart(3, "0")}`}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {sample.capturedAt
                ? new Date(sample.capturedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "No date"}
            </div>
            {/* Sample ID */}
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs text-muted-foreground">Sample ID:</span>
              <span className="font-mono text-xs">{sample.id}</span>
            </div>
          </div>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
    </button>
  )
}

// Enhanced Report Item Component
const ReportItem = ({ report, index, onClick }: { report: any; index: number; onClick: () => void }) => {
  const getReportIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "analysis":
        return <BarChart3 className="w-4 h-4" />
      case "summary":
        return <FileText className="w-4 h-4" />
      case "diagnostic":
        return <Activity className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <CheckCircle className="w-3 h-3 text-chart-4" />
      case "processing":
        return <Clock className="w-3 h-3 text-chart-3" />
      case "failed":
        return <XCircle className="w-3 h-3 text-destructive" />
      default:
        return <AlertCircle className="w-3 h-3 text-chart-5" />
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      className="group flex items-center justify-between p-4 bg-gradient-to-r from-card to-muted/30 hover:from-muted/50 hover:to-chart-2/10 dark:from-card dark:to-muted/20 dark:hover:from-muted/30 dark:hover:to-chart-2/10 rounded-xl transition-all duration-300 border-2 border-border/30 hover:border-chart-2/30 dark:border-border/20 dark:hover:border-chart-2/40 w-full text-left shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-4">
        <div className="p-2 bg-chart-2/20 rounded-lg">{getReportIcon(report.type)}</div>
        <div className="flex-1">
          <div className="font-semibold text-foreground text-base flex items-center gap-2 mb-1">
            {report.title || `Report #${String(index + 1).padStart(3, "0")}`}
            <Badge variant="secondary" className="bg-chart-2/10 text-chart-2 text-xs">
              {report.type || "Analysis"}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {report.createdAt
                ? new Date(report.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "No date"}
            </div>
            <div className="flex items-center gap-1">
              {getStatusIcon(report.status)}
              {report.status || "Draft"}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Download className="w-4 h-4" />
        </Button>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-chart-2 transition-colors" />
      </div>
    </div>
  )
}

// Enhanced Patient Item Component
const PatientItem = ({ patient, index, onClick }: { patient: any; index: number; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group flex items-center justify-between p-4 bg-gradient-to-r from-card to-muted/30 hover:from-muted/50 hover:to-chart-4/10 dark:from-card dark:to-muted/20 dark:hover:from-muted/30 dark:hover:to-chart-4/10 rounded-xl transition-all duration-300 border-2 border-border/30 hover:border-chart-4/30 dark:border-border/20 dark:hover:border-chart-4/40 w-full text-left shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
  >
    <div className="flex items-center gap-4">
      <Avatar className="h-10 w-10 ring-2 ring-chart-4/30">
        <AvatarImage src={patient.imageUrl || ""} alt={`${patient.firstName} ${patient.lastName}`} />
        <AvatarFallback className="bg-chart-4/20 text-chart-4 text-sm font-medium">
          {patient.firstName?.[0]}
          {patient.lastName?.[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="font-semibold text-foreground text-base mb-1">
          {patient.firstName} {patient.lastName}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            ID: {patient.id?.slice(0, 8)}...
          </div>
          {patient.email && (
            <div className="flex items-center gap-1">
              <span>•</span>
              {patient.email}
            </div>
          )}
        </div>
      </div>
    </div>
    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-chart-4 transition-colors" />
  </button>
)

export default function ProfilePageLayout({
  entity,
  samples,
  reports,
  metaEntity,
  editDialogTrigger,
  details,
  actions,
  sampleList,
  reportList,
  reportCount,
  patientsList,
  patientsCount,
  patients,
}: ProfilePageLayoutProps) {
  const router = useRouter()

  // Search and filter states
  const [samplesSearch, setSamplesSearch] = useState("")
  const [reportsSearch, setReportsSearch] = useState("")
  const [patientsSearch, setPatientsSearch] = useState("")
  const [samplesFilter, setSamplesFilter] = useState("all")
  const [reportsFilter, setReportsFilter] = useState("all")
  const [samplesSort, setSamplesSort] = useState("newest")
  const [reportsSort, setReportsSort] = useState("newest")

  // Calculate some stats
  const recentSamples = samples.filter((sample) => {
    const sampleDate = new Date(sample.capturedAt || sample.createdAt)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return sampleDate > weekAgo
  }).length

  // Filter and sort functions
  const filteredSamples = samples
    .filter((sample) => {
      const matchesSearch =
        sample.sampleName?.toLowerCase().includes(samplesSearch.toLowerCase()) ||
        `Sample #${samples.indexOf(sample) + 1}`.toLowerCase().includes(samplesSearch.toLowerCase())
      const matchesFilter = samplesFilter === "all" || sample.status === samplesFilter
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (samplesSort) {
        case "newest":
          return new Date(b.capturedAt || b.createdAt).getTime() - new Date(a.capturedAt || a.createdAt).getTime()
        case "oldest":
          return new Date(a.capturedAt || a.createdAt).getTime() - new Date(b.capturedAt || b.createdAt).getTime()
        case "name":
          return (a.sampleName || "").localeCompare(b.sampleName || "")
        default:
          return 0
      }
    })

  const filteredReports = reports
    .filter((report) => {
      const matchesSearch =
        report.title?.toLowerCase().includes(reportsSearch.toLowerCase()) ||
        `Report #${reports.indexOf(report) + 1}`.toLowerCase().includes(reportsSearch.toLowerCase())
      const matchesFilter = reportsFilter === "all" || report.status === reportsFilter
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (reportsSort) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "name":
          return (a.title || "").localeCompare(b.title || "")
        default:
          return 0
      }
    })

  // Ensure patientsList is always an array
  const safePatientsList: any[] = Array.isArray(patientsList) ? patientsList : [];
  const filteredPatients = safePatientsList.filter(
    (patient: any) =>
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(patientsSearch.toLowerCase()) ||
      patient.email.toLowerCase().includes(patientsSearch.toLowerCase()),
  )

  // Remove the code that attaches patient to each sample
  // Remove the UserButton for sample.patient in the SampleItem component


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/20 dark:from-background dark:via-muted/10 dark:to-accent/10">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-3rem)]">
          {/* Enhanced Info Panel */}
          <div className="col-span-4">
            <Card className="h-full shadow-xl border-2 border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden dark:border-border/20 dark:bg-card/90">
              {/* Profile Header with Gradient */}
              <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-6 text-primary-foreground relative overflow-hidden dark:from-primary dark:via-primary/95 dark:to-primary/85">
                <div className="absolute inset-0 bg-black/10 dark:bg-black/20"></div>
                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 ring-4 ring-primary-foreground/30 shadow-lg">
                      <AvatarImage src={entity.imageUrl || ""} alt={`${entity.firstName} ${entity.lastName}`} />
                      <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xl font-bold backdrop-blur-sm">
                        {entity.firstName[0]}
                        {entity.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl font-bold text-primary-foreground leading-tight">
                        {entity.firstName} {entity.lastName}
                      </h1>
                      {entity.email && <p className="text-primary-foreground/80 text-sm mt-1">{entity.email}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="secondary"
                          className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 text-xs"
                        >
                          <User className="w-3 h-3 mr-1" />
                          {entity.role || "User"}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 text-xs"
                        >
                          <Activity className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    </div>
                    <div className="relative z-10">{editDialogTrigger}</div>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-foreground/10 rounded-full"></div>
                <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-primary-foreground/5 rounded-full"></div>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Enhanced Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-chart-1/20 to-chart-1/30 dark:from-chart-1/10 dark:to-chart-1/20 rounded-xl p-4 border border-chart-1/30 dark:border-chart-1/20 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-chart-1 rounded-lg">
                        <TestTube className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-foreground">{samples.length}</div>
                        <div className="text-xs text-muted-foreground font-medium">Samples</div>
                      </div>
                    </div>
                    {recentSamples > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-chart-1">
                        <TrendingUp className="w-3 h-3" />+{recentSamples} this week
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-chart-2/20 to-chart-2/30 dark:from-chart-2/10 dark:to-chart-2/20 rounded-xl p-4 border border-chart-2/30 dark:border-chart-2/20 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-chart-2 rounded-lg">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-foreground">{reportCount ?? reports.length}</div>
                        <div className="text-xs text-muted-foreground font-medium">Reports</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-chart-2">
                      <BarChart3 className="w-3 h-3" />
                      Analysis ready
                    </div>
                  </div>
                </div>

                {/* Additional Stats for Users with Patients */}
                {typeof patientsCount === "number" && (
                  <div className="bg-gradient-to-br from-chart-4/20 to-chart-4/30 dark:from-chart-4/10 dark:to-chart-4/20 rounded-xl p-4 border border-chart-4/30 dark:border-chart-4/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-chart-4 rounded-lg">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-foreground">{patientsCount}</div>
                        <div className="text-xs text-muted-foreground font-medium">Patients</div>
                      </div>
                    </div>
                  </div>
                )}

                <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* Enhanced Details Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Details
                  </h3>
                  <div className="bg-muted/50 dark:bg-muted/30 rounded-lg p-4 border border-border/50">{details}</div>
                </div>

                {actions && (
                  <>
                    <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground">Actions</h3>
                      {actions}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Content Panel */}
          <div className="col-span-8">
            <Card className="h-full shadow-xl border-2 border-border/50 bg-card/80 backdrop-blur-sm dark:border-border/20 dark:bg-card/90">
              <Tabs defaultValue="samples" className="h-full flex flex-col">
                {/* Enhanced Header */}
                <div className="p-6 border-b border-border bg-gradient-to-r from-muted/30 to-accent/20 dark:from-muted/10 dark:to-accent/10">
                  <TabsList className="bg-card/80 backdrop-blur-sm p-1 shadow-md border border-border/50 dark:bg-card/90 dark:border-border/30">
                    <TabsTrigger
                      value="samples"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-chart-1 data-[state=active]:to-chart-1/80 data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 text-sm font-medium transition-all"
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      Samples ({samples.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="reports"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-chart-2 data-[state=active]:to-chart-2/80 data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 text-sm font-medium transition-all"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Reports ({reportCount ?? reports.length})
                    </TabsTrigger>
                    {patientsList && (
                      <TabsTrigger
                        value="patients"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-chart-4 data-[state=active]:to-chart-4/80 data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 text-sm font-medium transition-all"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Patients{typeof patientsCount === "number" ? ` (${patientsCount})` : ""}
                      </TabsTrigger>
                    )}
                  </TabsList>
                </div>

                {/* Enhanced Content */}
                <div className="flex-1 overflow-hidden">
                  {/* Samples Tab */}
                  <TabsContent value="samples" className="h-full m-0 flex flex-col">
                    {/* Search and Filter Bar */}
                    <div className="p-4 border-b border-border bg-muted/20 dark:bg-muted/10">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            placeholder="Search samples..."
                            value={samplesSearch}
                            onChange={(e) => setSamplesSearch(e.target.value)}
                            className="pl-10 bg-card border-border/50"
                          />
                        </div>
                        
                        <Select value={samplesSort} onValueChange={setSamplesSort}>
                          <SelectTrigger className="w-32 bg-card">
                            <ArrowUpDown className="w-4 h-4 mr-2" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest</SelectItem>
                            <SelectItem value="oldest">Oldest</SelectItem>
                            <SelectItem value="name">Name</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden p-4">
                      {sampleList ??
                        (filteredSamples.length > 0 ? (
                          <div className="space-y-3 h-full overflow-auto custom-scrollbar">
                            {filteredSamples.map((sample, index) => (
                              <SampleItem
                                key={`${sample.id}-${index}`}
                                sample={sample}
                                index={samples.indexOf(sample)}
                                onClick={() => router.push(`/samples/${sample.id}`)}
                              />
                            ))}
                          </div>
                        ) : samples.length === 0 ? (
                          <EmptyState
                            icon={TestTube}
                            title="No samples yet"
                            description="Upload your first sample to begin analysis and generate comprehensive reports with AI-powered detection."
                            actionLabel="Upload Sample"
                            onAction={() => router.push("/samples/upload")}
                            gradient="bg-gradient-to-br from-chart-1 to-chart-1/80"
                          />
                        ) : (
                          <EmptyState
                            icon={Search}
                            title="No samples found"
                            description="Try adjusting your search terms or filters to find the samples you're looking for."
                            gradient="bg-gradient-to-br from-muted-foreground to-muted-foreground/80"
                          />
                        ))}
                    </div>
                  </TabsContent>

                  {/* Reports Tab */}
                  <TabsContent value="reports" className="h-full m-0 flex flex-col">
                    {/* Search and Filter Bar */}
                    <div className="p-4 border-b border-border bg-muted/20 dark:bg-muted/10">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            placeholder="Search reports..."
                            value={reportsSearch}
                            onChange={(e) => setReportsSearch(e.target.value)}
                            className="pl-10 bg-card border-border/50"
                          />
                        </div>
                        <Select value={reportsFilter} onValueChange={setReportsFilter}>
                          <SelectTrigger className="w-32 bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Finalized">Finalized</SelectItem>
                            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                            <SelectItem value="ARCHIVED">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={reportsSort} onValueChange={setReportsSort}>
                          <SelectTrigger className="w-32 bg-card">
                            <ArrowUpDown className="w-4 h-4 mr-2" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest</SelectItem>
                            <SelectItem value="oldest">Oldest</SelectItem>
                            <SelectItem value="name">Name</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden p-4">
                      {filteredReports.length > 0 ? (
                        <div className="space-y-3 h-full overflow-auto custom-scrollbar">
                          {filteredReports.map((report, index) => (
                            <ReportItem
                              key={`${report.id}-${index}`}
                              report={report}
                              index={reports.indexOf(report)}
                              onClick={() => router.push(`/reports/${report.id}`)}
                            />
                          ))}
                        </div>
                      ) : reports.length === 0 ? (
                        <EmptyState
                          icon={FileText}
                          title="No reports generated"
                          description="Reports will appear here once you analyze your samples. Start by uploading samples and running AI detection."
                          actionLabel="View Samples"
                          onAction={() => router.push("/samples")}
                          gradient="bg-gradient-to-br from-chart-2 to-chart-2/80"
                        />
                      ) : (
                        <EmptyState
                          icon={Search}
                          title="No reports found"
                          description="Try adjusting your search terms or filters to find the reports you're looking for."
                          gradient="bg-gradient-to-br from-muted-foreground to-muted-foreground/80"
                        />
                      )}
                    </div>
                  </TabsContent>

                  {/* Patients Tab */}
                  {patientsList && (
                    <TabsContent value="patients" className="h-full m-0 flex flex-col">
                      {/* Search Bar */}
                      <div className="p-4 border-b border-border bg-muted/20 dark:bg-muted/10">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            placeholder="Search patients..."
                            value={patientsSearch}
                            onChange={(e) => setPatientsSearch(e.target.value)}
                            className="pl-10 bg-card border-border/50"
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 overflow-hidden p-4">
                        {filteredPatients.length > 0 ? (
                          <div className="space-y-3 h-full overflow-auto custom-scrollbar">
                            {filteredPatients.map((patient: any, index: number) => (
                              <PatientItem
                                key={`${patient.id}-${index}`}
                                patient={patient}
                                index={index}
                                onClick={() => router.push(`/patients/${patient.id}`)}
                              />
                            ))}
                          </div>
                        ) : (
                          <EmptyState
                            icon={Search}
                            title="No patients found"
                            description="Try adjusting your search terms to find the patients you're looking for."
                            gradient="bg-gradient-to-br from-muted-foreground to-muted-foreground/80"
                          />
                        )}
                      </div>
                    </TabsContent>
                  )}
                </div>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
