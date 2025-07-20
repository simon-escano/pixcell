
import { getReportById, getPatientById, getSampleById, getProfileByUserId, getRoleById } from "@/db/queries/select";
import Base from "@/components/base";
import ReportPreview from "@/components/reports/report-preview";
import { PDFExport } from "@/components/reports/pdf-export";
import ReportActions from "./report-actions-client";
import { Card } from "@/components/ui/card";
import { Edit, Trash2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

// interface Params { id: string | string[] }
export default async function ReportPage({ params }: { params: Promise<{ id: string | string[] }> }) {
  const { id } = await params;
  const reportId = Array.isArray(id) ? id[0] : (id ?? "");
  const report = await getReportById(reportId);
  if (!report) {
    return <div className="flex justify-center items-center h-96">Report not found.</div>;
  }
  const patient = report.patientId ? await getPatientById(report.patientId) : null;
  const sample = report.sampleId ? await getSampleById(report.sampleId) : null;
  let doctor = null, role = null;
  if (sample?.createdBy) {
    doctor = await getProfileByUserId(sample.createdBy);
    if (doctor?.roleId) role = await getRoleById(doctor.roleId);
  }

  // Ensure content is always an object with string text and array tables
  const contentObj = (typeof report.content === 'object' && report.content !== null)
    ? report.content as any
    : { text: '', tables: [] };

  const formData = {
    title: report.title || "",
    testType: report.testType || "",
    content: typeof contentObj.text === 'string' ? contentObj.text : "",
    isAiGenerated: report.isAiGenerated || false,
  };
  const reportContent = {
    text: typeof contentObj.text === 'string' ? contentObj.text : "",
    tables: Array.isArray(contentObj.tables) ? contentObj.tables : [],
  };
  const doctorName = doctor ? `${doctor.firstName} ${doctor.lastName}` : "N/A";
  const doctorRole = role && role.id && role.name ? role : { id: 'unknown', name: 'Doctor' };
  const doctorLicense = (doctor && 'licenseNo' in doctor && (doctor as any).licenseNo) ? (doctor as any).licenseNo : "N/A";

  // Small client component for actions (delete, QR, etc.)
  // const ReportActions = dynamic(() => import("./report-actions-client"), { ssr: false });

  return (
    <Base>
      <div className="flex flex-col md:flex-row gap-8 p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex-1 min-w-0">
          <ReportPreview
            formData={formData}
            reportContent={reportContent}
            selectedPatient={patient ?? undefined}
            selectedSample={sample ? { ...sample, createdByName: doctorName } : undefined}
            doctorName={doctorName}
            doctorRole={doctorRole}
            doctorLicense={doctorLicense}
          />
        </div>
        <div className="w-full md:w-80 flex flex-col gap-6">
          <ReportActions
            reportId={reportId}
            reportStatus={report.status ?? ""}
            formData={formData}
            reportCode={report.code ?? ""}
          />
        </div>
      </div>
    </Base>



    
  );
} 