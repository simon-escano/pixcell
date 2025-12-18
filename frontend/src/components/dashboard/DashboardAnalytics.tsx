"use client"

import type React from "react"
import { getDashboardStats } from "@/actions/dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { useEffect, useState } from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DashboardStats {
  genderStats: {
    gender: string
    count: number
    month: string
  }[]
}

interface DashboardAnalyticsProps {
  organizationId: string
}

export function DashboardAnalytics({ organizationId }: DashboardAnalyticsProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [genderFilter, setGenderFilter] = useState<string>("all")

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getDashboardStats(organizationId)
        setStats({ genderStats: data.genderStats })
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [organizationId])

  if (loading) {
    return (
      <Card className="border shadow-sm py-0">
        <CardHeader className="p-4">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <Skeleton className="h-[220px]" />
        </CardContent>
      </Card>
    )
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
    <Card className="border shadow-sm py-0">
      <CardHeader className="flex flex-row justify-between p-4">
        <CardTitle className="text-base font-semibold">Patient Demographics Overview</CardTitle>
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
  )
}

