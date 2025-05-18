"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Users, 
  Microscope, 
  FileText, 
  UserCheck,
  BarChart3,
  Activity,
  TrendingUp,
  UserPlus,
  Calendar
} from "lucide-react"
import { useEffect, useState } from "react"
import { getDashboardStats } from "@/app/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface DashboardStats {
  totalPatients: number
  totalSamples: number
  totalReports: number
  activeUsers: number
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
    imageUrl: string
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
}

function formatDate(date: Date | null) {
  if (!date) return 'N/A';
  return format(new Date(date), 'MMM d, yyyy');
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getDashboardStats()
        setStats(data)
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-8 p-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Patients"
          value={stats?.totalPatients ?? 0}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Total Samples"
          value={stats?.totalSamples ?? 0}
          icon={<Microscope className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Total Reports"
          value={stats?.totalReports ?? 0}
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Active Users"
          value={stats?.activeUsers ?? 0}
          icon={<UserCheck className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.monthlyStats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.monthlyStats.appointmentsChange && stats?.monthlyStats.appointmentsChange > 0 ? '+' : ''}
              {stats?.monthlyStats.appointmentsChange?.toFixed(1) || '0'}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.monthlyStats.newPatients}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.monthlyStats.newPatientsChange && stats?.monthlyStats.newPatientsChange > 0 ? '+' : ''}
              {stats?.monthlyStats.newPatientsChange?.toFixed(1) || '0'}% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Patient Visits by Gender</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.genderStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Recent Reports</h3>
              <div className="space-y-2">
                {stats?.patientsWithLastReport.map((report) => (
                  <div
                    key={`${report.patientId}-${report.sampleId || 'no-sample'}-${report.reportCreatedAt || report.dateTaken}`}
                    className="flex items-center justify-between p-3 bg-white rounded-lg shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {report.userImage ? (
                          <img
                            src={report.userImage}
                            alt={report.userName}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-500">
                              {report.userName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {report.patientName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {report.sampleName || 'Sample'} • {formatDate(report.reportCreatedAt || report.dateTaken)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        report.isAiGenerated 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {report.isAiGenerated ? 'AI Generated' : 'Manual'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recently Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Recently Uploaded Files</h3>
              <div className="space-y-2">
                {stats?.recentUploads.map((upload) => (
                  <div
                    key={`${upload.id}-${upload.capturedAt}`}
                    className="flex items-center justify-between p-3 bg-white rounded-lg shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <img
                          src={upload.imageUrl}
                          alt="Sample"
                          className="w-8 h-8 rounded object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {upload.patientName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {upload.sampleName || 'Sample'} • {formatDate(upload.capturedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      by {upload.uploadedBy}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon 
}: { 
  title: string
  value: number
  icon: React.ReactNode 
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-[150px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <Skeleton className="h-4 w-[200px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px]" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-[150px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                    <Skeleton className="h-4 w-[80px]" />
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