import Base from "@/components/base";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllReports, getReportsByGeneratedBy } from "@/db/queries/select";
import { getUser } from "@/lib/auth";
import { format } from "date-fns";
import { FileText, User } from "lucide-react";
import Link from "next/link";
import { getProfileByUserId, getRoleById } from "@/db/queries/select";
import ReportsTable from "@/components/reports/reports-table";
import { cookies } from "next/headers";

export default async function ReportsPage({ searchParams }: { searchParams: { search?: string } }) {
  const user = await getUser();
  const profile = await getProfileByUserId(user.id);
  const role = await getRoleById(profile.roleId);
  
  // If user is admin, show all reports, otherwise show only user's reports
  const reports = role.name === "Administrator"
    ? await getAllReports()
    : await getReportsByGeneratedBy(user.id);

  // Normalize reports to ensure consistent structure
  const normalizedReports = reports.map((report: any) => ({
    id: report.id,
    title: report.title || '',
    testType: report.testType,
    createdAt: report.createdAt,
    patientName: report.patientName || '',
    patientId: report.patientId || '',
    patientImage: report.patientImage || '',
    generatedByName: report.generatedByName || '',
    generatedByImage: report.generatedByImage || '',
    generatedByRole: report.generatedByRole || '',
    generatedById: report.generatedById || '',
    status: report.status,
    
    // add any other fields needed by the table here
  }));

  console.log("reports", reports);

  return (
    <Base>
      <div className="h-full overflow-y-auto p-4 sm:p-8">
        {/* We cast to 'any' because we intentionally provide a minimal report object for the table */}
        <ReportsTable reports={normalizedReports as any} initialSearch={searchParams?.search || ""} />
      </div>
    </Base>
  );
}
