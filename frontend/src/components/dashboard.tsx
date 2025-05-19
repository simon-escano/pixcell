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
  Calendar,
  Mail,
  Phone,
  Award
} from "lucide-react"
import { useEffect, useState } from "react"
import { getDashboardStats } from "@/app/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Badge } from "@/components/ui/badge"

interface DashboardStats {
  totalPatients: number;
  totalSamples: number;
  totalReports: number;
  activeUsers: number;
  reportsLast30Days: number;
  reportsPerPatient: number;
  patientsWithLastReport: {
    patientId: string;
    patientName: string;
    sampleId: string | null;
    sampleName: string | null;
    dateTaken: Date | null;
    userId: string | null;
    userName: string;
    userEmail: string;
    userImage: string | null;
    isAiGenerated: boolean | null;
    reportCreatedAt: Date | null;
  }[];
  recentUploads: {
    id: string;
    sampleName: string | null;
    capturedAt: Date | null;
    imageUrl: string;
    patientName: string;
    uploadedBy: string;
  }[];
  genderStats: {
    gender: string;
    count: number;
    month: string;
  }[];
  monthlyStats: {
    totalAppointments: number
    newPatients: number
    appointmentsChange?: number
    newPatientsChange?: number
  }
}

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  phone: string | null
  imageUrl: string | null
  role: string
}

interface DashboardProps {
  userProfile: UserProfile | null;
}

function formatDate(date: Date | null) {
  if (!date) return "N/A";
  return format(new Date(date), "MMM d, yyyy");
}

// Helper function to transform gender stats data for recharts
function transformGenderStats(data: DashboardStats['genderStats']) {
  const transformedData: Record<string, any> = {};

  data.forEach(item => {
    if (!transformedData[item.month]) {
      transformedData[item.month] = { month: item.month };
    }
    transformedData[item.month][item.gender] = item.count;
  });

  // Convert object back to array
  return Object.values(transformedData).sort((a, b) => a.month.localeCompare(b.month));
}

export function Dashboard({ userProfile }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false);
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <DashboardSkeleton />;
  }

  const transformedGenderStats = stats?.genderStats ? transformGenderStats(stats.genderStats) : [];

  return (
    <div className="space-y-8 p-8">
      {/* Profile Section */}
      {userProfile && (
        <div className="grid gap-4 md:grid-cols-4 mb-9">
          {/* Main Profile Card */}
          <Card className="md:col-span-4 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-5">
              <div className="flex flex-col items-center space-y-3.5">
                <div className="relative">
                  <Avatar className="size-24 rounded-full border-3 border-background shadow-md">
                    <AvatarImage
                      src={userProfile.imageUrl || ""}
                      alt={`${userProfile.firstName} ${userProfile.lastName}`}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-lg">
                      {userProfile.firstName[0]}
                      {userProfile.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <Badge 
                    variant="secondary" 
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 text-xs font-medium"
                  >
                    {userProfile.role}
                  </Badge>
                </div>
                <div className="text-center space-y-0.5">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {userProfile.firstName} {userProfile.lastName}
                  </h2>
                  <p className="text-sm text-muted-foreground">Welcome back!</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Removed: Info Cards */}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Patients"
          value={stats?.totalPatients ?? 0}
          icon={<Users className="text-muted-foreground h-4 w-4" />}
        />
        <StatCard
          title="Total Samples"
          value={stats?.totalSamples ?? 0}
          icon={<Microscope className="text-muted-foreground h-4 w-4" />}
        />
        <StatCard
          title="Total Reports"
          value={stats?.totalReports ?? 0}
          icon={<FileText className="text-muted-foreground h-4 w-4" />}
        />
        <StatCard
          title="Active Users"
          value={stats?.activeUsers ?? 0}
          icon={<UserCheck className="text-muted-foreground h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="leading-none font-semibold">
              Total Appointments
            </CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl leading-none font-bold">
              {stats?.monthlyStats.totalAppointments}
            </div>
            {(() => {
              const change = stats?.monthlyStats?.appointmentsChange ?? 0;
              return (
                <p className="text-muted-foreground mt-1.5 text-xs">
                  <span
                    className={change > 0 ? "text-green-500" : "text-red-500"}
                  >
                    {change > 0 ? "+" : ""}
                    {change.toFixed(1)}%
                  </span>
                  {" from last month"}
                </p>
              );
            })()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="leading-none font-semibold">
              New Patients
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl leading-none font-bold">
              {stats?.monthlyStats.newPatients}
            </div>
            {(() => {
              const change = stats?.monthlyStats?.appointmentsChange ?? 0;
              return (
                <p className="text-muted-foreground mt-1.5 text-xs">
                  <span
                    className={change > 0 ? "text-green-500" : "text-red-500"}
                  >
                    {change > 0 ? "+" : ""}
                    {change.toFixed(1)}%
                  </span>
                  {" from last month"}
                </p>
              );
            })()}
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
                <LineChart data={transformedGenderStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  {/* Line for Male */}
                  <Line type="monotone" dataKey="Male" stroke="#8884d8" name="Male" />
                  {/* Line for Female */}
                  <Line type="monotone" dataKey="Female" stroke="#82ca9d" name="Female" />
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
              <div className="space-y-2">
                {stats?.patientsWithLastReport.map((report) => (
                  <div
                    key={`${report.patientId}-${report.sampleId || "no-sample"}-${report.reportCreatedAt || report.dateTaken}`}
                    className="bg-sidebar-accent flex items-center justify-between rounded-lg p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {report.userImage ? (
                          <img
                            src={report.userImage}
                            alt={report.userName}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="bg-sidebar-accent flex h-8 w-8 items-center justify-center rounded-full">
                            <span className="text-muted-foreground text-sm font-medium">
                              {report.userName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-foreground text-sm font-medium">
                          {report.patientName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {report.sampleName || "Sample"} •{" "}
                          {formatDate(
                            report.reportCreatedAt || report.dateTaken,
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          report.isAiGenerated
                            ? "bg-blue-200 text-blue-800"
                            : "bg-green-200 text-green-800"
                        }`}
                      >
                        {report.isAiGenerated ? "AI Generated" : "Manual"}
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
              <div className="space-y-2">
                {stats?.recentUploads.map((upload) => (
                  <div
                    key={`${upload.id}-${upload.capturedAt}`}
                    className="bg-sidebar-accent flex items-center justify-between rounded-lg p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <img
                          src={upload.imageUrl}
                          alt="Sample"
                          className="h-8 w-8 rounded object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-foreground text-sm font-medium">
                          {upload.patientName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {upload.sampleName || "Sample"} •{" "}
                          {formatDate(upload.capturedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      by {upload.uploadedBy}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="leading-none font-semibold">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl leading-6 font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <>
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
    </>
  );
}
