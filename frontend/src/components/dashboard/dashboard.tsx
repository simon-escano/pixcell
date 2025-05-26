"use client";

import { getDashboardStats } from "@/actions/dashoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Calendar, FileText, Microscope, UserCheck, Users, User } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DashboardStats {
  totalPatients: number;
  totalSamples: number;
  totalReports: number;
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
    totalAppointments: number;
    newPatients: number;
    appointmentsChange?: number;
    newPatientsChange?: number;
  };
}

interface DashboardProps {
  userProfile: {
    firstName: string;
    lastName: string;
    imageUrl: string | null;
  };
  userRole: string;
}

export function Dashboard({ userProfile, userRole }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [genderFilter, setGenderFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Transform data for the line chart
  const transformedData = stats?.genderStats.reduce((acc: any[], curr) => {
    const existingMonth = acc.find(item => item.month === curr.month);
    if (existingMonth) {
      existingMonth[curr.gender.toLowerCase()] = curr.count;
    } else {
      acc.push({
        month: curr.month,
        [curr.gender.toLowerCase()]: curr.count,
        male: curr.gender.toLowerCase() === 'male' ? curr.count : 0,
        female: curr.gender.toLowerCase() === 'female' ? curr.count : 0,
      });
    }
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div className="space-y-6">
      <Card className="bg-sidebar-accent border-none">
        <CardContent className="">
          <div className="flex items-center space-x-4">
            <Avatar className="h-14 w-14 rounded-lg">
              <AvatarImage 
                src={userProfile?.imageUrl || ""} 
                alt={`${userProfile?.firstName} ${userProfile?.lastName}`}
                className="rounded-lg" 
              />
              <AvatarFallback className="bg-primary/10 rounded-lg">
                {userProfile?.firstName?.[0]}
                {userProfile?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">
                {userProfile?.firstName} {userProfile?.lastName}
              </p>
              <p className="text-muted-foreground text-sm">{userRole}</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
          title="New Patients"
          value={stats?.monthlyStats.newPatients ?? 0}
          icon={<Users className="text-muted-foreground h-4 w-4" />}
          subtitle={
            <p className="text-muted-foreground mt-1.5 text-xs">
              <span
                className={stats?.monthlyStats?.newPatientsChange && stats.monthlyStats.newPatientsChange > 0 ? "text-green-500" : "text-red-500"}
              >
                {stats?.monthlyStats?.newPatientsChange && stats.monthlyStats.newPatientsChange > 0 ? "+" : ""}
                {stats?.monthlyStats?.newPatientsChange?.toFixed(1) ?? 0}%
              </span>
              {" from last month"}
            </p>
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Patient Visits by Gender</CardTitle>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={transformedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => format(new Date(value + '-01'), 'MMM yyyy')}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Patients']}
                    labelFormatter={(label) => format(new Date(label + '-01'), 'MMMM yyyy')}
                  />
                  <Line
                    type="monotone"
                    dataKey="male"
                    name="Male"
                    stroke="#3b82f6"
                    strokeWidth={genderFilter === "male" ? 3 : 2}
                    opacity={genderFilter === "all" || genderFilter === "male" ? 1 : 0.3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="female"
                    name="Female"
                    stroke="#ec4899"
                    strokeWidth={genderFilter === "female" ? 3 : 2}
                    opacity={genderFilter === "all" || genderFilter === "female" ? 1 : 0.3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
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
                            className="h-8 w-8 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="bg-sidebar-accent flex h-8 w-8 items-center justify-center rounded-lg">
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
                          className="h-8 w-8 rounded-lg object-cover"
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
    </div>
  );
}

function formatDate(date: Date | null) {
  if (!date) return "N/A";
  return format(new Date(date), "MMM d, yyyy");
}

function StatCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="leading-none font-semibold">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl leading-6 font-bold">{value}</div>
        {subtitle}
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
