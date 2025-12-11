import Base from "@/components/base";
import { getPatientById, getReportCountByPatientId, getSamplesByPatientId, getReportsByPatientId } from "@/db/queries/select";
import PatientProfileClient from "./PatientProfileClient";
import { getMetaPatientById, getMetaSampleImagesBySampleId } from "../../samples/queries";

export default async function PatientPage({
  params,
}: {
  params: Promise<{ patientId: string; organizationId: string }>;
}) {
  const paramsObj = await params;
  const patientId = paramsObj.patientId;
  const patientData = await getPatientById(patientId);
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
