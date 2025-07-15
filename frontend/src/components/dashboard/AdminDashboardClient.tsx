"use client"
import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, User, ImageIcon, FileText, Database, PieChartIcon, Settings, Shield } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function CompactStatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-2">
        <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400">{title}</CardTitle>
        <div className="text-gray-500 dark:text-gray-400 group-hover:scale-110 transition-transform h-3 w-3">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-2">
        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
      </CardContent>
    </Card>
  )
}

function ProfessionalStorageChart({ used, total }: { used: number; total: number }) {
  const percentUsed = Math.min(used / total, 1)
  const percentFree = 1 - percentUsed

  return (
    <div className="space-y-4">
      {/* Storage Overview */}
      <div className="text-center space-y-2">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{Math.round(percentUsed * 100)}%</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Storage Used</div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentUsed * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Used: {used} MB</span>
          <span>Free: {(total - used).toFixed(1)} MB</span>
        </div>
      </div>

      {/* Storage Breakdown */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{used} MB</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Used Space</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{total} MB</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Space</div>
        </div>
      </div>
    </div>
  )
}

function ProfessionalUserDistribution({
  roleCounts,
}: { roleCounts: { role: string; count: number; color: string }[] }) {
  const total = roleCounts.reduce((sum, r) => sum + r.count, 0)

  return (
    <div className="space-y-4">
      {/* Total Users Overview */}
      <div className="text-center space-y-2">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{total}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Total Users</div>
      </div>

      {/* Role Distribution */}
      <div className="space-y-3">
        {roleCounts.map((role, index) => {
          const percentage = (role.count / total) * 100
          return (
            <div key={role.role} className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }} />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{role.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{percentage.toFixed(1)}%</span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{role.count}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: role.color,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Stats */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{roleCounts.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Active Roles</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {Math.round(total / roleCounts.length)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Avg per Role</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboardCompact({
  mainMetrics,
  storageUsedMB,
  storageCapacityMB,
  storageFreeMB,
  roleCounts,
  genderStats,
}: any) {
  const [genderFilter, setGenderFilter] = useState<string>("all")

  const transformedData = genderStats
    ?.reduce((acc: any[], curr: any) => {
      const genderKey = curr.gender === "M" ? "male" : curr.gender === "F" ? "female" : curr.gender?.toLowerCase()
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
    .sort((a: any, b: any) => a.month.localeCompare(b.month))

  return (
    <div className="space-y-3">
      {/* Ultra Compact Admin Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 rounded-lg p-3 border">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">System Administration</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">Monitor and manage platform</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs font-medium px-2 py-0.5">
          {format(new Date(), "MMM d")}
        </Badge>
      </div>

      {/* Ultra Compact Metrics Grid */}
      <div className="grid gap-2 md:grid-cols-4">
        <CompactStatCard title="Total Users" value={mainMetrics[0]?.value || 0} icon={<Users className="h-3 w-3" />} />
        <CompactStatCard
          title="Total Patients"
          value={mainMetrics[1]?.value || 0}
          icon={<User className="h-3 w-3" />}
        />
        <CompactStatCard
          title="Total Images"
          value={mainMetrics[2]?.value || 0}
          icon={<ImageIcon className="h-3 w-3" />}
        />
        <CompactStatCard
          title="Total Reports"
          value={mainMetrics[3]?.value || 0}
          icon={<FileText className="h-3 w-3" />}
        />
      </div>

      {/* Ultra Compact Patient Demographics Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between py-2 px-4">
          <CardTitle className="text-sm font-semibold">Patient Demographics Overview</CardTitle>
          <div className="flex items-center space-x-2">
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
            <Button asChild size="sm" variant="outline" className="h-7 text-xs bg-transparent px-2">
              <Link href="/patients">
                <Settings className="h-2.5 w-2.5 mr-1 text-gray-500" />
                Manage
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="h-[140px]">
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
                  activeDot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="female"
                  name="Female"
                  stroke="#ec4899"
                  strokeWidth={genderFilter === "female" ? 2.5 : 1.5}
                  opacity={genderFilter === "all" || genderFilter === "female" ? 1 : 0.3}
                  dot={{ r: 2, fill: "#ec4899" }}
                  activeDot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Professional System Analytics */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between py-2 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Database className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              Storage Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ProfessionalStorageChart used={Number.parseFloat(storageUsedMB)} total={storageCapacityMB} />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between py-2 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <PieChartIcon className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              User Distribution
            </CardTitle>
            <Button asChild size="sm" variant="outline" className="h-7 text-xs bg-transparent px-2">
              <Link href="/users">
                <Settings className="h-2.5 w-2.5 mr-1 text-gray-500" />
                Manage
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ProfessionalUserDistribution roleCounts={roleCounts} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
