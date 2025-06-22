"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, User, Image as ImageIcon, FileText, Database, PieChart as PieChartIcon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 py-1.5 px-6">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <span className="h-4 w-4">{icon}</span>
      </CardHeader>
      <CardContent className="px-6 pb-2 py-1.5">
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function StoragePieChart({ used, total }: { used: number; total: number }) {
  const radius = 48;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const percentUsed = Math.min(used / total, 1);
  const strokeDashoffset = circumference - percentUsed * circumference;
  return (
    <svg height={radius * 2} width={radius * 2} className="mx-auto block" style={{ transform: 'rotate(-90deg)' }}>
      <circle
        stroke="#e5e7eb"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      {percentUsed > 0 && (
        <circle
          stroke="#3b82f6"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.35s' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          strokeLinecap="round"
        />
      )}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        fontSize="1.25rem"
        fill="#111827"
        fontWeight="bold"
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
      >
        {Math.round(percentUsed * 100)}%
      </text>
    </svg>
  );
}

function UsersPerRolePieChart({ roleCounts }: { roleCounts: { role: string; count: number; color: string }[] }) {
  const radius = 48;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const total = roleCounts.reduce((sum, r) => sum + r.count, 0);
  let prevPercent = 0;
  let offset = 0;
  return (
    <svg height={radius * 2} width={radius * 2} className="mx-auto block">
      {roleCounts.map((r, i) => {
        const percent = r.count / total;
        const arcLength = percent * circumference;
        const dashArray = `${arcLength} ${circumference - arcLength}`;
        const dashOffset = offset;
        offset -= arcLength;
        return (
          <circle
            key={r.role}
            stroke={r.color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeLinecap="butt"
          />
        );
      })}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        fontSize="1.25rem"
        fill="#111827"
        fontWeight="bold"
      >
        {total}
      </text>
    </svg>
  );
}

export default function AdminDashboardClient({
  mainMetrics,
  storageUsedMB,
  storageCapacityMB,
  storageFreeMB,
  roleCounts,
  genderStats,
}: any) {
  // --- Line chart logic copied from dashboard.tsx ---
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const transformedData = genderStats?.reduce((acc: any[], curr: any) => {
    const genderKey = curr.gender === 'M' ? 'male' : curr.gender === 'F' ? 'female' : curr.gender?.toLowerCase();
    const existingMonth = acc.find(item => item.month === curr.month);
    if (existingMonth) {
      existingMonth[genderKey] = curr.count;
    } else {
      acc.push({
        month: curr.month,
        [genderKey]: curr.count,
        male: curr.gender === 'M' ? curr.count : 0,
        female: curr.gender === 'F' ? curr.count : 0,
      });
    }
    return acc;
  }, []).sort((a: any, b: any) => a.month.localeCompare(b.month));
  // --- End line chart logic ---

  return (
    <div className="space-y-2">
      <div className="grid gap-2 md:grid-cols-4">
        {mainMetrics.map((metric: any) => (
          <StatCard key={metric.title} title={metric.title} value={metric.value} icon={metric.icon} />
        ))}
      </div>
      {/* Patients by Gender Line Chart */}
      <Card className="col-span-2">
        <CardHeader className="flex flex-row items-center justify-between py-3 px-6">
          <CardTitle className="text-sm font-semibold">Patients by Gender</CardTitle>
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
        <CardContent className="py-3 px-6">
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={transformedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={(value) => format(new Date(value + '-01'), 'MMM yyyy')}
                  tick={{ fontSize: 12, fontWeight: 500 }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fontWeight: 500 }}
                  allowDecimals={false}
                />
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
                  dot={{ r: 3 }}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="female"
                  name="Female"
                  stroke="#ec4899"
                  strokeWidth={genderFilter === "female" ? 3 : 2}
                  opacity={genderFilter === "all" || genderFilter === "female" ? 1 : 0.3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-end mt-4">
            <Link href="/patients">
              <button className="rounded-md bg-primary text-white px-3 py-1.5 text-sm font-semibold shadow hover:bg-primary/90 transition-colors">
                Manage Patients
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-2 md:grid-cols-2">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 py-1.5 px-6">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Database className="text-muted-foreground h-4 w-4" /> Storage Used
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="flex flex-col md:flex-row items-center gap-8 w-full">
              <div className="flex-1 flex flex-col items-center">
                <StoragePieChart used={parseFloat(storageUsedMB)} total={storageCapacityMB} />
                <div className="mt-4 flex flex-col items-center w-full">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: '#3b82f6' }}></span>
                    <span className="text-xs text-muted-foreground">Used:</span>
                    <span className="text-xl font-bold align-middle">{storageUsedMB} MB</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#e5e7eb' }}></span>
                      Free: {storageFreeMB > 0 ? `${storageFreeMB.toFixed(2)} MB` : 'No free space'}
                    </span>
                    <span>Total: {storageCapacityMB} MB</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 py-1.5 px-6">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieChartIcon className="text-muted-foreground h-4 w-4" /> Users per Role
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center justify-center py-6 gap-6">
            <UsersPerRolePieChart roleCounts={roleCounts} />
            <div className="flex flex-col gap-2 items-start text-muted-foreground text-xs">
              {roleCounts.map((r: any) => (
                <div key={r.role} className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: r.color }}></span>
                  <span>{r.role}: {r.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="flex justify-end w-full px-6 pb-4">
            <Link href="/users">
              <button className="rounded-md bg-primary text-white px-3 py-1.5 text-sm font-semibold shadow hover:bg-primary/90 transition-colors">
                Manage Users
              </button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
} 