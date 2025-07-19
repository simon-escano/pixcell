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
    // Handle different report structures from different queries
    const baseReport = {
      id: report.id,
      title: report.title || '',
      testType: report.testType || '',
      status: report.status || 'pending',
      createdAt: report.createdAt,
      content: report.content || '',
      isAiGenerated: report.isAiGenerated || false,
      exportedUrl: report.exportedUrl || '',
      exportFormat: report.exportFormat || '',
      sampleId: report.sampleId || '',
      sampleName: report.sampleName || '',
      patientId: report.patientId || '',
      patientName: report.patientName || '',
      patientImage: report.patientImage || '',
      generatedBy: report.generatedBy || report.generatedById || '',
      generatedById: report.generatedById || report.generatedBy || '',
      generatedByName: report.generatedByName || '',
      generatedByImage: report.generatedByImage || '',
      generatedByRole: report.generatedByRole || '',
    };
    
    return baseReport;
  });

  console.log("reports", reports);

  return (
    <Base>
      <div className="h-full overflow-y-auto p-4 sm:p-8">
        <ReportsTable reports={normalizedReports} />
      </div>
    </Base>
  );
}
