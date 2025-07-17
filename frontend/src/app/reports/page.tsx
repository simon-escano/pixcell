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

  // Normalize all fields that could possibly be objects
  function extractString(val: unknown): string {
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object' && 'value' in val && typeof (val as any).value === 'string') {
      return (val as any).value;
    }
    return '';
  }
  const normalizedReports = reports.map((report) => ({
    ...report,
    patientName: extractString(report.patientName),
    generatedByName: extractString(report.generatedByName),
    patientImage: extractString(report.patientImage),
    generatedByImage: extractString(report.generatedByImage),
    sampleName: extractString(report.sampleName),
    generatedByRole: extractString(report.generatedByRole),
    content: extractString(report.content),
    exportedUrl: extractString(report.exportedUrl),
    exportFormat: extractString(report.exportFormat),
  }));

  console.log("reports", reports);

  return (
    <Base>
      <div className="h-full overflow-y-auto p-4 sm:p-8">
        <ReportsTable reports={reports}>

        </ReportsTable>

      </div>
    </Base>
  );
}
