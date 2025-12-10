import Base from "@/components/base"
import { Card, CardContent } from "@/components/ui/card"
import { getAllPatientsForUser, getAllSamples, getSamplesByUserId } from "@/db/queries/select"
import { getUser } from "@/lib/auth"
import {
  Activity,
  AlertCircle,
  Clock,
  FileImage,
  TrendingUp
} from "lucide-react"
import type React from "react"
import { getMetaProfileByUserId, getMetaSampleById, getMetaSampleImagesBySampleId } from "./queries"
import SampleBrowserClient from "@/components/samples/sample-browser-client"

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
    className="flex-1 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all"
    style={{ background: "var(--card)", border: "2px solid var(--border)" }}
  >
    <CardContent>
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
        <div className={`p-2 rounded-full ${color}`}>{icon}</div>
      </div>
    </CardContent>
  </Card>
)

const SamplesPage = async ({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) => {
  const organizationId = (await params).organizationId;
  const currentUser = await getUser()
  const metaUser = await getMetaProfileByUserId(currentUser.id)
  const samples = (metaUser?.role == "Administrator") ? await getAllSamples(organizationId) : await getSamplesByUserId(currentUser.id, organizationId);
  const reports = (metaUser?.role == "Administrator") ? await import("@/db/queries/select").then(m => m.getAllReports(organizationId)) : await import("@/db/queries/select").then(m => m.getAllReportsByUserId(currentUser.id))
  let patientsRaw = await getAllPatientsForUser(metaUser?.id!, metaUser?.role!, organizationId);
  // Map to MetaPatient type
  let patients = patientsRaw.map((p: any) => ({
    ...p,
    fullName: `${p.firstName} ${p.lastName}`,
    role: p.role ?? "Patient",
    createdBy: p.createdBy ?? metaUser?.id ?? "",
  }));

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
    const date = 'createdAt' in sample ? sample.createdAt : sample.capturedAt;
    if (!date) return false;
    const dateObj = new Date(date);
    return dateObj.getMonth() === currentMonth && dateObj.getFullYear() === currentYear;
  }).length;

  const samplesLastMonth = samples.filter((sample) => {
    const date = 'createdAt' in sample ? sample.createdAt : sample.capturedAt;
    if (!date) return false;
    const dateObj = new Date(date);
    return dateObj.getMonth() === lastMonth && dateObj.getFullYear() === lastMonthYear;
  }).length;

  const trendValue = samplesLastMonth === 0
    ? (samplesThisMonth > 0 ? 100 : 0)
    : ((samplesThisMonth - samplesLastMonth) / samplesLastMonth) * 100;
  const trendString = `${trendValue >= 0 ? "+" : ""}${trendValue.toFixed(0)}% this month`;

  const recentSamples = samples.filter((sample) => {
    const date = 'createdAt' in sample ? sample.createdAt : sample.capturedAt;
    if (!date) return false;
    const sampleDate = new Date(date);
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
          <div className="w-full mb-8 overflow-x-auto">
            <div className="overflow-visible">
              <div className="flex min-w-[78rem] sm:min-w-[77rem] lg:min-w-[76rem] gap-4">
                {/* cards */}
              </div>
            </div>
          </div>
          <div className="flex w-full pb-8 overflow-x-auto">
            <div className="flex min-w-[78rem] sm:min-w-[77rem] lg:min-w-[76rem] gap-4">
              <StatsCard
                title="Total Samples"
                value={totalSamples}
                icon={<FileImage className="w-5 h-5 text-white" />}
                color="bg-gradient-to-r from-blue-500 to-blue-600"
                trend={trendString}
              />
              <StatsCard
                title="Recent Samples"
                value={recentSamples}
                icon={<Clock className="w-5 h-5 text-white" />}
                color="bg-gradient-to-r from-green-500 to-green-600"
                trend="Last 7 days"
              />
              <StatsCard
                title="Samples Pending Analysis"
                value={samplesPendingAnalysis}
                icon={<Activity className="w-5 h-5 text-white" />}
                color="bg-gradient-to-r from-orange-500 to-orange-600"
                trend="No report yet"
              />
              <StatsCard
                title="Samples Analyzed This Month"
                value={samplesAnalyzedThisMonth}
                icon={<Activity className="w-5 h-5 text-white" />}
                color="bg-gradient-to-r from-purple-500 to-purple-600"
                trend="Analyzed this month"
              />
              <StatsCard
                title="Flagged/Abnormal Results"
                value={abnormalResults}
                icon={<AlertCircle className="w-5 h-5 text-white" />}
                color="bg-gradient-to-r from-red-500 to-red-600"
                trend="Contains 'abnormal'"
              />
            </div>
          </div>

          {/* Search and Filter Bar + Samples Grid (Client) */}
          <SampleBrowserClient samples={metaSamples} currentUser={metaUser!} patients={patients} />
          {/* Load More Button */}
        </div>

      </div>
    </Base>
  )
}

export default SamplesPage
