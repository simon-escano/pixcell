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
}

export function Dashboard({ userProfile, userRole }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [genderFilter, setGenderFilter] = useState<string>("all")

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getDashboardStats()
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

  // Transform data for the line chart
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
    <div className="space-y-3">
      {/* Ultra Compact Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-3 border">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8 ring-1 ring-blue-100 dark:ring-blue-900">
            <AvatarImage src={userProfile?.imageUrl || ""} alt={`${userProfile?.firstName} ${userProfile?.lastName}`} />
            <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-semibold text-xs">
              {userProfile?.firstName?.[0]}
              {userProfile?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Welcome back, {userProfile?.firstName}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">{userRole}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs font-medium px-2 py-0.5">
          {format(new Date(), "MMM d")}
        </Badge>
      </div>

      {/* Ultra Compact Metrics Grid */}
      <div className="grid gap-2 md:grid-cols-3">
        <CompactStatCard
          title="Total Patients"
          value={stats?.totalPatients ?? 0}
          icon={<Users className="h-3 w-3 text-gray-500 dark:text-gray-400" />}
          change={stats?.patientsChange ?? 0}
          changeLabel="from last month"
        />
        <CompactStatCard
          title="Total Samples"
          value={stats?.totalSamples ?? 0}
          icon={<Microscope className="h-3 w-3 text-gray-500 dark:text-gray-400" />}
          change={stats?.samplesChange ?? 0}
          changeLabel="from last month"
        />
        <CompactStatCard
          title="Total Reports"
          value={stats?.totalReports ?? 0}
          icon={<FileText className="h-3 w-3 text-gray-500 dark:text-gray-400" />}
          change={stats?.reportsChange ?? 0}
          changeLabel="from last month"
        />
      </div>

      {/* Ultra Compact Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between py-2 px-4">
          <CardTitle className="text-sm font-semibold">Patient Demographics</CardTitle>
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-28 h-7 text-xs">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={transformedData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(value) => format(new Date(value + "-01"), "MMM")}
                  tick={{ fontSize: 10, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fontWeight: 500 }}
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
                    borderRadius: "6px",
                    fontSize: "11px",
                    boxShadow: "0 2px 4px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="male"
                  name="Male"
                  stroke="#3b82f6"
                  strokeWidth={genderFilter === "male" ? 2.5 : 1.5}
                  opacity={genderFilter === "all" || genderFilter === "male" ? 1 : 0.3}
                  dot={{ r: 2, fill: "#3b82f6" }}
                  activeDot={{ r: 3, fill: "#3b82f6" }}
                />
                <Line
                  type="monotone"
                  dataKey="female"
                  name="Female"
                  stroke="#ec4899"
                  strokeWidth={genderFilter === "female" ? 2.5 : 1.5}
                  opacity={genderFilter === "all" || genderFilter === "female" ? 1 : 0.3}
                  dot={{ r: 2, fill: "#ec4899" }}
                  activeDot={{ r: 3, fill: "#ec4899" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Ultra Compact Activity Cards */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <FileText className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              Recent Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {stats?.patientsWithLastReport.length === 0 ? (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No recent reports found.</div>
              ) : (
                stats?.patientsWithLastReport.slice(0, 4).map((report, index) => (
                  <div
                    key={`${report.patientId}-${report.sampleId || "no-sample"}-${index}`}
                    className="flex items-center space-x-2 p-2 rounded-md bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors"
                  >
                    <Avatar className="h-6 w-6">
                      {report.userImage ? (
                        <AvatarImage src={report.userImage || "/placeholder.svg"} alt={report.userName} />
                      ) : (
                        <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs">
                          {report.userName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                        {report.patientName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {report.sampleName || "Sample"} • {formatDate(report.reportCreatedAt || report.dateTaken)}
                      </p>
                    </div>
                    <Badge variant={report.isAiGenerated ? "default" : "secondary"} className="text-xs px-1.5 py-0.5">
                      {report.isAiGenerated ? "AI" : "Manual"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Microscope className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              Recent Uploads
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {stats?.recentUploads.length === 0 ? (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No recent uploads found.</div>
              ) : (
                stats?.recentUploads.slice(0, 4).map((upload, index) => (
                  <div
                    key={`${upload.id}-${index}`}
                    className="flex items-center space-x-2 p-2 rounded-md bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors"
                  >
                    <div className="h-6 w-6 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <img
                        src={upload.imageUrl || "/placeholder.svg?height=24&width=24"}
                        alt="Sample"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                        {upload.patientName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{upload.sampleName || "Sample"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(upload.capturedAt)}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{upload.uploadedBy}</p>
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
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-2">
        <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400">{title}</CardTitle>
        <div className="h-3 w-3">{icon}</div>
      </CardHeader>
      <CardContent className="px-3 pb-2">
        <div className="flex items-baseline space-x-1">
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{value.toLocaleString()}</div>
          {change !== null && (
            <div
              className={`flex items-center text-xs font-medium ${
                isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-gray-500"
              }`}
            >
              {isPositive && <ArrowUpRight className="h-2.5 w-2.5" />}
              {isNegative && <ArrowDownRight className="h-2.5 w-2.5" />}
              {isPositive ? "+" : ""}
              {change.toFixed(1)}%
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{change === null ? "N/A" : changeLabel}</p>
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
      <div className="flex items-center space-x-3 p-4 rounded-lg border">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardHeader className="pb-2 px-4 pt-4">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="py-4 px-6">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <Skeleton className="h-[220px]" />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardHeader className="py-4 px-6">
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
