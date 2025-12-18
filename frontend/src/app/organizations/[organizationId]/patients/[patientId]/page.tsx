import Base from "@/components/base";
import { getPatientById, getReportCountByPatientId, getSamplesByPatientId, getReportsByPatientId, isPatientInOrganization } from "@/db/queries/select";
import PatientProfileClient from "./PatientProfileClient";
import { getMetaPatientById, getMetaSampleImagesBySampleId } from "../../samples/queries";
import { Metadata } from "next";
import AccessDeniedPage from "@/components/access-denied-page";

function truncate(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ patientId: string; organizationId: string }>;
}): Promise<Metadata> {
  const paramsObj = await params;
  const patient = await getPatientById(paramsObj.patientId);
  const patientName = patient 
    ? truncate(`${patient.firstName} ${patient.lastName}`)
    : "Patient";
  
  return {
    title: `PixCell | ${patientName}`,
  };
}

export default async function PatientPage({
  params,
}: {
  params: Promise<{ patientId: string; organizationId: string }>;
}) {
  const paramsObj = await params;
  const patientId = paramsObj.patientId;
  const organizationId = paramsObj.organizationId;
  
  const patientData = await getPatientById(patientId);
  if (!patientData) {
    return (
      <Base params={paramsObj}>
        <AccessDeniedPage 
          message="This patient does not exist."
          backUrl={`/organizations/${organizationId}/patients`}
          backLabel="Back to Patients"
        />
      </Base>
    );
  }

  // Check if patient belongs to the organization
  const belongsToOrg = await isPatientInOrganization(patientId, organizationId);
  if (!belongsToOrg) {
    return (
      <Base params={paramsObj}>
        <AccessDeniedPage 
          message="This patient does not exist in this organization."
          backUrl={`/organizations/${organizationId}/patients`}
          backLabel="Back to Patients"
        />
      </Base>
    );
  }

  const samplesRaw = await getSamplesByPatientId(patientId);
  // Deduplicate samples by id
  const samples = Object.values(
    samplesRaw.reduce((acc: Record<string, typeof samplesRaw[0]>, sample) => {
      if (!acc[sample.id]) acc[sample.id] = sample;
      return acc;
    }, {})
  );
  const reportCount = await getReportCountByPatientId(patientId);
  const reports = await getReportsByPatientId(patientId);
  const metaPatient = await getMetaPatientById(patientId);

  // Fetch sample images for each sample
  const samplesWithImages = await Promise.all(
    samples.map(async (sample) => ({
      ...sample,
      sampleImages: await getMetaSampleImagesBySampleId(sample.id),
    }))
  );

  return (
    <Base params={paramsObj}>
      <PatientProfileClient
        patient={patientData}
        metaPatient={metaPatient}
        samples={samplesWithImages}
        reports={reports}
        reportCount={reportCount}
      />
    </Base>
  );
}
