import type React from "react"
import { getAllSamples } from "@/db/queries/select"
import SampleCard from "./components/sample-card"
import { getMetaProfileByUserId, getMetaSampleById, getMetaSampleImagesBySampleId } from "./queries"
import Base from "@/components/base"
import { getUser } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Calendar,
  Users,
  FileImage,
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react"
import { Suspense } from "react"
import SampleBrowserClient from "./components/sample-browser-client"
import UploadSampleWrapper from "@/components/samples/upload-sample-wrapper"

// Loading skeleton component
const SampleCardSkeleton = () => (
  <Card className="animate-pulse">
    <CardContent className="p-4">
      <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded w-12"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </CardContent>
  </Card>
)

// Stats card component
const StatsCard = ({
  title,
  value,
  icon,
  trend,
  color,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  color: string
}) => (
  <Card
    className="backdrop-blur-sm shadow-lg hover:shadow-xl transition-all"
    style={{ background: "var(--card)", border: "2px solid var(--border)" }}
  >
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend && (
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
      </div>
    </CardContent>
  </Card>
)

// Sample grid component
const SampleGrid = async ({ samples, currentUser }: { samples: any[]; currentUser: any }) => {
  if (samples.length === 0) {
    return (
      <Card className="col-span-full bg-white/50 backdrop-blur-sm border-2 border-dashed border-gray-300">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileImage className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No samples found</h3>
          <p className="text-gray-500 text-center mb-6 max-w-md">
            Get started by creating your first sample. Upload images and begin your analysis journey.
          </p>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            Create First Sample
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {samples.map(async (sample) => {
        const metaSample = await getMetaSampleById(sample.id)
        const metaSampleImages = await getMetaSampleImagesBySampleId(sample.id)
        return (
          <div key={sample.id} className="group">
            <SampleCard currentUser={currentUser} sampleImages={metaSampleImages} sample={metaSample!} />
          </div>
        )
      })}
    </>
  )
}

const SamplesPage = async () => {
  const currentUser = await getUser()
  const metaUser = await getMetaProfileByUserId(currentUser.id)
  const samples = await getAllSamples()
  const reports = await import("@/db/queries/select").then(m => m.getAllReports())

  // Fetch meta sample and images for each sample
  const metaSamples = await Promise.all(samples.map(async (sample) => {
    const metaSample = await getMetaSampleById(sample.id)
    const metaSampleImages = await getMetaSampleImagesBySampleId(sample.id)
    return { ...metaSample, sampleImages: metaSampleImages }
  }))

  // Calculate stats
  const totalSamples = samples.length

  // Month-over-month trend calculation
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const samplesThisMonth = samples.filter((sample) => {
    if (!sample.createdAt) return false;
    const date = new Date(sample.createdAt);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;

  const samplesLastMonth = samples.filter((sample) => {
    if (!sample.createdAt) return false;
    const date = new Date(sample.createdAt);
    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
  }).length;

  const trendValue = samplesLastMonth === 0
    ? (samplesThisMonth > 0 ? 100 : 0)
    : ((samplesThisMonth - samplesLastMonth) / samplesLastMonth) * 100;
  const trendString = `${trendValue >= 0 ? "+" : ""}${trendValue.toFixed(0)}% this month`;

  const recentSamples = samples.filter((sample) => {
    if (!sample.createdAt) return false;
    const sampleDate = new Date(sample.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sampleDate > weekAgo;
  }).length;

  // --- New statistics ---
  // Map sampleId to reports
  const reportsBySampleId = new Map<string, any[]>();
  for (const report of reports) {
    if (!report.sampleId) continue; // Skip if sampleId is null or undefined
    if (!reportsBySampleId.has(report.sampleId)) {
      reportsBySampleId.set(report.sampleId, []);
    }
    reportsBySampleId.get(report.sampleId)!.push(report);
  }

  // Samples pending analysis: no report
  const samplesPendingAnalysis = samples.filter(s => !reportsBySampleId.has(s.id)).length;

  // Samples analyzed this month: at least one report in current month
  const samplesAnalyzedThisMonth = samples.filter(s => {
    const sampleReports = reportsBySampleId.get(s.id) || [];
    return sampleReports.some(r => {
      const d = new Date(r.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }).length;

  // Flagged/Abnormal Results: count reports where content.text includes 'abnormal' (case-insensitive)
  const abnormalResults = reports.filter(r => {
    if (!r.content) return false;
    let text = "";
    if (typeof r.content === "object" && r.content !== null && "text" in r.content) {
      text = String(r.content.text || "");
    } else if (typeof r.content === "string") {
      text = r.content;
    }
    return text.toLowerCase().includes("abnormal");
  }).length;

  return (
    <Base>
      <div className="min-h-screen" style={{ background: "var(--background)" }}>
     

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Section */}
          <div className="flex justify-center w-full mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 inline-flex">
              <StatsCard
                title="Total Samples"
                value={totalSamples}
                icon={<FileImage className="w-6 h-6 text-white" />}
                color="bg-gradient-to-r from-blue-500 to-blue-600"
                trend={trendString}
              />
              <StatsCard
                title="Recent Samples"
                value={recentSamples}
                icon={<Clock className="w-6 h-6 text-white" />}
                color="bg-gradient-to-r from-green-500 to-green-600"
                trend="Last 7 days"
              />
              <StatsCard
                title="Samples Pending Analysis"
                value={samplesPendingAnalysis}
                icon={<Activity className="w-6 h-6 text-white" />}
                color="bg-gradient-to-r from-orange-500 to-orange-600"
                trend="No report yet"
              />
              <StatsCard
                title="Samples Analyzed This Month"
                value={samplesAnalyzedThisMonth}
                icon={<Activity className="w-6 h-6 text-white" />}
                color="bg-gradient-to-r from-purple-500 to-purple-600"
                trend="Analyzed this month"
              />
              <StatsCard
                title="Flagged/Abnormal Results"
                value={abnormalResults}
                icon={<AlertCircle className="w-6 h-6 text-white" />}
                color="bg-gradient-to-r from-red-500 to-red-600"
                trend="Contains 'abnormal'"
              />
            </div>
          </div>

          {/* Search and Filter Bar + Samples Grid (Client) */}
          <SampleBrowserClient samples={metaSamples} currentUser={metaUser!} />
          {/* Load More Button */}
        </div>

      </div>
    </Base>
  )
}

export default SamplesPage
