"use client"
import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, PieChartIcon, Settings } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useParams } from "next/navigation"

function ProfessionalStorageChart({ used, total }: { used: number; total: number }) {
  const percentUsed = Math.min(used / total, 1)

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="text-3xl font-semibold text-gray-900 dark:text-gray-50">{Math.round(percentUsed * 100)}%</div>
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Storage Used</div>
      </div>

      <div className="space-y-2">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-300 ease-out hover:shadow-md cursor-pointer"
            style={{ width: `${percentUsed * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 font-medium">
          <span>Used: {used} MB</span>
          <span>Free: {(total - used).toFixed(1)} MB</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-50">{used} MB</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Used Space</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-50">{total} MB</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Space</div>
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
      <div className="text-center space-y-2">
        <div className="text-3xl font-semibold text-gray-900 dark:text-gray-50">{total}</div>
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Users</div>
      </div>

      <div className="space-y-3">
        {roleCounts.map((role) => {
          const percentage = (role.count / total) * 100
          return (
            <div key={role.role} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: role.color }} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{role.role}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{percentage.toFixed(1)}%</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-50 min-w-6 text-right">
                    {role.count}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300 ease-out hover:shadow-md cursor-pointer"
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

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-50">{roleCounts.length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Active Roles</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {Math.round(total / roleCounts.length)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Avg per Role</div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface AdminDashboardAnalyticsProps {
  storageUsedMB: string
  storageCapacityMB: number
  storageFreeMB: number
  roleCounts: Array<{
    role: string
    count: number
    color: string
  }>
  genderStats: Array<{
    gender: string
    count: number
    month: string
  }>
}

export default function AdminDashboardAnalytics({
  storageUsedMB,
  storageCapacityMB,
  storageFreeMB,
  roleCounts,
  genderStats,
}: AdminDashboardAnalyticsProps) {
  const [genderFilter, setGenderFilter] = useState<string>("all")
  const params = useParams()
  const orgId = (params as any)?.organizationId || ""

  const transformedData = genderStats
    ?.reduce((acc: any[], curr: any) => {
      const genderKey = curr.gender === "M" ? "male" : curr.gender === "F" ? "female" : curr.gender?.toLowerCase()
      let monthObj = acc.find((item) => item.month === curr.month)
      if (!monthObj) {
        monthObj = { month: curr.month, male: 0, female: 0 }
        acc.push(monthObj)
      }
      monthObj[genderKey] += curr.count
      return acc
    }, [])
    .sort((a: any, b: any) => a.month.localeCompare(b.month))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-lg min-w-24">
        <div className="font-semibold text-xs mb-1 text-gray-900 dark:text-gray-100">
          {format(new Date(label + "-01"), "MMMM yyyy")}
        </div>
        <div className="space-y-1">
          {payload
            .filter((entry: any) => entry.value !== 0)
            .map((entry: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-200">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium">{entry.name}:</span>
                <span className="tabular-nums ml-0.5">{Number.parseInt(entry.value, 10)}</span>
              </div>
            ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border shadow-sm py-0">
        <CardHeader className="flex flex-row justify-between p-4">
          <CardTitle className="text-base font-semibold">Patient Demographics Overview</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="h-9 text-sm px-3 w-32">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild size="sm" variant="outline" className="h-9 text-xs px-3 bg-transparent">
              <Link href={orgId ? `/organizations/${orgId}/patients` : `/patients`}>
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Manage
              </Link>
            </Button>
          </div>
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
                  domain={["auto", "auto"]}
                />
                <Tooltip content={CustomTooltip} />
                <Line
                  type="monotone"
                  dataKey="male"
                  name="Male"
                  stroke="#3b82f6"
                  strokeWidth={genderFilter === "male" ? 2.5 : 2}
                  opacity={genderFilter === "all" || genderFilter === "male" ? 1 : 0.3}
                  dot={{ r: 3, fill: "#3b82f6" }}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="female"
                  name="Female"
                  stroke="#ec4899"
                  strokeWidth={genderFilter === "female" ? 2.5 : 2}
                  opacity={genderFilter === "all" || genderFilter === "female" ? 1 : 0.3}
                  dot={{ r: 3, fill: "#ec4899" }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border shadow-sm py-0">
          <CardHeader className="flex flex-row justify-between p-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <Database className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              Storage Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-4">
            <ProfessionalStorageChart used={Number.parseFloat(storageUsedMB)} total={storageCapacityMB} />
          </CardContent>
        </Card>

        <Card className="border shadow-sm py-0">
          <CardHeader className="flex flex-row justify-between p-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                <PieChartIcon className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </div>
              User Distribution
            </CardTitle>
            <Button asChild size="sm" variant="outline" className="h-9 text-xs px-3 bg-transparent">
              <Link href={orgId ? `/organizations/${orgId}/users` : `/users`}>
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Manage
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-6 pb-4">
            <ProfessionalUserDistribution roleCounts={roleCounts} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

