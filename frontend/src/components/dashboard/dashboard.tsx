"use client"

import type React from "react"

import { getDashboardStats } from "@/actions/dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { FileText, Microscope, Users, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useEffect, useState } from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface DashboardStats {
  totalPatients: number
  totalSamples: number
  totalReports: number
  reportsLast30Days: number
  reportsPerPatient: number
  patientsWithLastReport: {
    patientId: string
    patientName: string
    sampleId: string | null
    sampleName: string | null
    dateTaken: Date | null
    userId: string | null
    userName: string
    userEmail: string
    userImage: string | null
    isAiGenerated: boolean | null
    reportCreatedAt: Date | null
  }[]
  recentUploads: {
    id: string
    sampleName: string | null
    capturedAt: Date | null
    imageUrl: string | null
    patientName: string
    uploadedBy: string
  }[]
  genderStats: {
    gender: string
    count: number
    month: string
  }[]
  monthlyStats: {
    totalAppointments: number
    newPatients: number
    appointmentsChange?: number
    newPatientsChange?: number
  }
  patientsChange: number
  samplesChange: number
  reportsChange: number
}

interface DashboardProps {
  userProfile: {
    firstName: string
    lastName: string
    imageUrl: string | null
  }
  userRole: string
  organizationId: string
}

export function Dashboard({ userProfile, userRole, organizationId }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [genderFilter, setGenderFilter] = useState<string>("all")

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getDashboardStats(organizationId)
        setStats(data)
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  const transformedData = stats?.genderStats
    .reduce((acc: any[], curr) => {
      const genderKey = curr.gender === "M" ? "male" : curr.gender === "F" ? "female" : curr.gender.toLowerCase()
      const existingMonth = acc.find((item) => item.month === curr.month)
      if (existingMonth) {
        existingMonth[genderKey] = curr.count
      } else {
        acc.push({
          month: curr.month,
          [genderKey]: curr.count,
          male: curr.gender === "M" ? curr.count : 0,
          female: curr.gender === "F" ? curr.count : 0,
        })
      }
      return acc
    }, [])
    .sort((a, b) => a.month.localeCompare(b.month))

  return (
    <div className="space-y-4">
      {/* Ultra Compact Header */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/30 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-blue-200 dark:ring-blue-900/50">
            <AvatarImage src={userProfile?.imageUrl || ""} alt={`${userProfile?.firstName} ${userProfile?.lastName}`} />
            <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 font-semibold">
              {userProfile?.firstName?.[0]}
              {userProfile?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
              Welcome back, {userProfile?.firstName}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">{userRole}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs font-medium px-3 py-1">
          {format(new Date(), "MMM d")}
        </Badge>
      </div>

      {/* Ultra Compact Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <CompactStatCard
          title="Total Patients"
          value={stats?.totalPatients ?? 0}
          icon={<Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
          change={stats?.patientsChange ?? 0}
          changeLabel="from last month"
        />
        <CompactStatCard
          title="Total Samples"
          value={stats?.totalSamples ?? 0}
          icon={<Microscope className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
          change={stats?.samplesChange ?? 0}
          changeLabel="from last month"
        />
        <CompactStatCard
          title="Total Reports"
          value={stats?.totalReports ?? 0}
          icon={<FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
          change={stats?.reportsChange ?? 0}
          changeLabel="from last month"
        />
      </div>

      {/* Ultra Compact Chart */}
      <Card className="border shadow-sm py-0">
        <CardHeader className="flex flex-row justify-between p-4">
          <CardTitle className="text-base font-semibold">Patient Demographics</CardTitle>
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-6 pb-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={transformedData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(value) => format(new Date(value + "-01"), "MMM")}
                  tick={{ fontSize: 12, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fontWeight: 500 }}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [value, name === "male" ? "Male" : "Female"]}
                  labelFormatter={(label) => format(new Date(label + "-01"), "MMMM yyyy")}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="male"
                  name="Male"
                  stroke="#3b82f6"
                  strokeWidth={genderFilter === "male" ? 2.5 : 2}
                  opacity={genderFilter === "all" || genderFilter === "male" ? 1 : 0.3}
                  dot={{ r: 3, fill: "#3b82f6" }}
                  activeDot={{ r: 4, fill: "#3b82f6" }}
                />
                <Line
                  type="monotone"
                  dataKey="female"
                  name="Female"
                  stroke="#ec4899"
                  strokeWidth={genderFilter === "female" ? 2.5 : 2}
                  opacity={genderFilter === "all" || genderFilter === "female" ? 1 : 0.3}
                  dot={{ r: 3, fill: "#ec4899" }}
                  activeDot={{ r: 4, fill: "#ec4899" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Ultra Compact Activity Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border shadow-sm py-0">
          <CardHeader className="p-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              Recent Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-4">
            <div className="space-y-3">
              {stats?.patientsWithLastReport.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                  No recent reports found.
                </div>
              ) : (
                stats?.patientsWithLastReport.slice(0, 4).map((report, index) => (
                  <div
                    key={`${report.patientId}-${report.sampleId || "no-sample"}-${index}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors border dark:border-slate-800"
                  >
                    <Avatar className="h-8 w-8">
                      {report.userImage ? (
                        <AvatarImage src={report.userImage || "/placeholder.svg"} alt={report.userName} />
                      ) : (
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 text-xs font-medium">
                          {report.userName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
                        {report.patientName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {report.sampleName || "Sample"} • {formatDate(report.reportCreatedAt || report.dateTaken)}
                      </p>
                    </div>
                    <Badge variant={report.isAiGenerated ? "default" : "secondary"} className="text-xs">
                      {report.isAiGenerated ? "AI" : "Manual"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm py-0">
          <CardHeader className="p-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Microscope className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              Recent Uploads
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-4">
            <div className="space-y-3">
              {stats?.recentUploads.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                  No recent uploads found.
                </div>
              ) : (
                stats?.recentUploads.slice(0, 4).map((upload, index) => (
                  <div
                    key={`${upload.id}-${index}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors border dark:border-slate-800"
                  >
                    <div className="h-8 w-8 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                      <img
                        src={upload.imageUrl || "/placeholder.svg?height=32&width=32"}
                        alt="Sample"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
                        {upload.patientName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {upload.sampleName || "Sample"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-600 dark:text-gray-400">{formatDate(upload.capturedAt)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{upload.uploadedBy}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CompactStatCard({
  title,
  value,
  icon,
  change,
  changeLabel,
}: {
  title: string
  value: number
  icon: React.ReactNode
  change: number | null
  changeLabel: string
}) {
  const isPositive = change !== null && change > 0
  const isNegative = change !== null && change < 0

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow py-0">
      <CardHeader className="flex flex-row justify-between space-y-0 pb-2 px-4 pt-4">
        <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400 tracking-wide">
          {title}
        </CardTitle>
        <div className="h-4 w-4">{icon}</div>
      </CardHeader>
      <CardContent className="px-4 pb-4 -mt-4">
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-medium text-gray-900 dark:text-gray-50">{value.toLocaleString()}</div>
          {change !== null && (
            <div
              className={`flex items-center gap-0.5 text-xs font-semibold ${
                isPositive
                  ? "text-green-600 dark:text-green-400"
                  : isNegative
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {isPositive && <ArrowUpRight className="h-3 w-3" />}
              {isNegative && <ArrowDownRight className="h-3 w-3" />}
              {isPositive ? "+" : ""}
              {change.toFixed(1)}%
            </div>
          )}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{change === null ? "N/A" : changeLabel}</p>
      </CardContent>
    </Card>
  )
}

function formatDate(date: Date | null) {
  if (!date) return "N/A"
  return format(new Date(date), "MMM d")
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border shadow-sm py-0">
            <CardHeader className="pb-2 px-6 pt-4">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent className="px-6 pb-4">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border shadow-sm py-0">
        <CardHeader className="p-4">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <Skeleton className="h-[220px]" />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="border shadow-sm py-0">
            <CardHeader className="p-4">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center space-x-3 p-3 rounded-lg">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-5 w-12" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
