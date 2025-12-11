import Base from "@/components/base";
import ReportsTable from "@/components/reports/reports-table";
import { getAllReports, getProfileByUserId, getReportsByGeneratedBy, getRoleById } from "@/db/queries/select";
import { getUser } from "@/lib/auth";

interface ReportPageProps {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ search?: string }>;
}

export default async function ReportsPage({
  params: _,
  searchParams,
}: ReportPageProps) {
  const params = await searchParams;
  const paramsObj = await _;
  const organizationId = paramsObj.organizationId;
  const user = await getUser();
  const profile = await getProfileByUserId(user.id);
  const role = await getRoleById(profile.roleId);
  
  // If user is admin, show all reports, otherwise show only user's reports
  const reports = role.name === "Administrator"
    ? await getAllReports(organizationId)
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
    <Base params={paramsObj}>
      <div className="h-full overflow-y-auto p-4 sm:p-8">
        {/* We cast to 'any' because we intentionally provide a minimal report object for the table */}
        <ReportsTable reports={normalizedReports as any} organizationId={organizationId} />
      </div>
    </Base>
  );
}
