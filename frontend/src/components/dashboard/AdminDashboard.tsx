import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllUsers, getAllSamples, getAllReports, getAllPatientsForUser, getAllUsersWithProfiles, getPatientGenderStats } from "@/db/queries/select";
import { createClient } from '@supabase/supabase-js';
import { Users, User, Image as ImageIcon, FileText, Database, PieChart as PieChartIcon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import AdminDashboardClient from './AdminDashboardClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key on server only!
);

async function getSupabaseStorageUsage(bucket: string) {
  let total = 0;
  let page = 0;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1000, offset: page * 1000 });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const file of data) {
      if (file.metadata && file.metadata.size) {
        total += file.metadata.size;
      }
    }
    hasMore = data.length === 1000;
    page++;
  }
  return total;
}

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
  const stroke = 8; // Thinner pie chart
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const percentUsed = Math.min(used / total, 1);
  const strokeDashoffset = circumference - percentUsed * circumference;
  return (
    <svg height={radius * 2} width={radius * 2} className="mx-auto block" style={{ transform: 'rotate(-90deg)' }}>
      <circle
        stroke="#e5e7eb" // Tailwind gray-200
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      {percentUsed > 0 && (
        <circle
          stroke="#3b82f6" // Tailwind blue-500
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
  const stroke = 8; // Thinner pie chart
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

const ROLE_COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // green-500
  "#f59e42", // orange-400
  "#6366f1", // indigo-500
  "#ef4444", // red-500
  "#a855f7", // purple-500
  "#fbbf24", // yellow-400
];

// Change to accept profileId as a prop
export default async function AdminDashboard({ profileId }: { profileId: string }) {
  const users = await getAllUsers();
  const patients = await getAllPatientsForUser(profileId, "Administrator");
  const samples = await getAllSamples();
  const reports = await getAllReports();
  const usersWithProfiles = await getAllUsersWithProfiles();
  const genderStats = await getPatientGenderStats();
  // Calculate storage used in the 'sample-images' bucket
  let storageUsed = 0;
  try {
    storageUsed = await getSupabaseStorageUsage('sample-images');
  } catch (e) {
    storageUsed = 0;
  }
  const storageUsedMB = (storageUsed / (1024 * 1024)).toFixed(2);
  const storageCapacityMB = 5 * 1024; // Assume 5GB total storage
  const storageFreeMB = storageCapacityMB - parseFloat(storageUsedMB);

  // Count users per role
  const roleMap: Record<string, number> = {};
  usersWithProfiles.forEach((u) => {
    if (!u.roleName) return;
    roleMap[u.roleName] = (roleMap[u.roleName] || 0) + 1;
  });
  const roleCounts = Object.entries(roleMap).map(([role, count], i) => ({
    role,
    count,
    color: ROLE_COLORS[i % ROLE_COLORS.length],
  }));

  const mainMetrics = [
    { title: "Total Users", value: usersWithProfiles.length, icon: <Users className="text-muted-foreground h-4 w-4" /> },
    { title: "Total Patients", value: patients.length, icon: <User className="text-muted-foreground h-4 w-4" /> },
    { title: "Total Images", value: samples.length, icon: <ImageIcon className="text-muted-foreground h-4 w-4" /> },
    { title: "Total Reports", value: reports.length, icon: <FileText className="text-muted-foreground h-4 w-4" /> },
  ];

  return (
    <AdminDashboardClient
      mainMetrics={mainMetrics}
      storageUsedMB={storageUsedMB}
      storageCapacityMB={storageCapacityMB}
      storageFreeMB={storageFreeMB}
      roleCounts={roleCounts}
      genderStats={genderStats}
    />
  );
} 