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

export default async function ReportsPage() {
  const user = await getUser();
  const profile = await getProfileByUserId(user.id);
  const role = await getRoleById(profile.roleId);
  
  // If user is admin, show all reports, otherwise show only user's reports
  const reports = role.name === "Administrator"
    ? await getAllReports()
    : await getReportsByGeneratedBy(user.id);

  // Normalize reports to ensure consistent structure
  const normalizedReports = reports.map((report: any) => {
    const baseReport = {
      id: report.id,
      title: report.title || '',
      createdAt: report.createdAt ? format(new Date(report.createdAt), 'MMMM d, yyyy') : '',
      patientName: report.patientName || '',
      generatedBy: report.generatedByName || '',
      status: report.status,
    };
    return baseReport;
  });

  console.log("reports", reports);

  return (
    <Base>
      <div className="h-full overflow-y-auto p-4 sm:p-8">
        {/* We cast to 'any' because we intentionally provide a minimal report object for the table */}
        <ReportsTable reports={normalizedReports as any} />
      </div>
    </Base>
  );
}
