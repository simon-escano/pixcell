import { getMetaProfileByUserId } from "@/app/samples/queries";
import Base from "@/components/base";
import EditReportForm from "@/components/reports/edit-report-form";
import { getAllPatientsForUser, getAllProfiles, getReportById } from "@/db/queries/select";
import { getUser } from "@/lib/auth";
import { notFound } from "next/navigation";

// We'll inline the edit form logic here for now, but ideally this would be a shared component
export default async function EditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reportId = id;
  const report = await getReportById(reportId);
  if (!report) return notFound();

  const user = await getUser();
  const profile = await getMetaProfileByUserId(user.id);
  const patientsRaw = await getAllPatientsForUser(profile!.id, profile!.role, true);
  let patients = patientsRaw.map((p: any) => ({
    ...p,
    fullName: `${p.firstName} ${p.lastName}`,
    role: p.role ?? "Patient",
    createdBy: p.createdBy ?? profile?.id ?? "",
  }));
  
  let profiles = (await getAllProfiles()).map((p: any) => {
    if (p.imageId === null) {
      const { imageId, ...rest } = p;
      return rest;
    }
    return p;
  });

  // Prefill form data from report
  const contentObj = (typeof report.content === 'object' && report.content !== null)
    ? report.content as any
    : { text: '', tables: [] };

  const initialFormData = {
    title: report.title || "",
    testType: report.testType || "",
    content: typeof contentObj.text === 'string' ? contentObj.text : "",
    isAiGenerated: report.isAiGenerated || false,
  };
  const initialReportContent = {
    text: typeof contentObj.text === 'string' ? contentObj.text : "",
    tables: Array.isArray(contentObj.tables) ? contentObj.tables : [],
  };

  // Find the patient and sample for this report
  const selectedPatientId = report.patientId || "";
  const selectedSampleId = report.sampleId || "";

  // We'll use a client component for the form to handle state and submission
  // Pass initial values and an onSubmit handler that calls updateReport
  return (
    <Base>
      <div className="h-full overflow-y-auto p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <EditReportForm
            patients={patients}
            currentUserId={user.id}
            profiles={profiles}
            role={profile!.role}
            initialFormData={initialFormData}
            initialReportContent={initialReportContent}
            reportId={reportId}
            initialPatientId={selectedPatientId}
            initialSampleId={selectedSampleId}
          />
        </div>
      </div>
    </Base>
  );
}
