import Base from "@/components/base";
import ReportsList from "@/components/reports/reports-list";
import { getAllReports, getProfileByUserId, getReportsByGeneratedBy, getRoleByUserIdAndOrganizationId } from "@/db/queries/select";
import { getUser } from "@/lib/auth";

interface ReportPageProps {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ search?: string }>;
}

export const metadata = {
  title: "PixCell | Reports",
};

export default async function ReportsPage({
  params: _,
  searchParams,
}: ReportPageProps) {
  const params = await searchParams;
  const paramsObj = await _;
  const organizationId = paramsObj.organizationId;
  const user = await getUser();
  const profile = await getProfileByUserId(user.id);
  const role = await getRoleByUserIdAndOrganizationId(user.id, organizationId);
  
  // If user is admin, show all reports, otherwise show only user's reports
  const reports = role && role.name === "Administrator"
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
    isAiGenerated: report.isAiGenerated || false,
  }));

  const isAdmin = role && role.name === "Administrator";

  return (
    <Base params={paramsObj}>
      <div className="h-full overflow-y-auto relative">
        <ReportsList reports={normalizedReports as any} organizationId={organizationId} isAdmin={isAdmin} />
      </div>
    </Base>
  );
}
