import { SamplePageWrapper } from "@/components/samples/sample-area/sample-page-wrapper";
import {
  getPatientById,
  getProfileByUserId,
  getRoleById,
  getSampleById,
} from "@/db/queries/select";
import Base from "@/components/base";

export default async function EditSamplePage({
  params,
}: {
  params: Promise<{ sampleId: string }>;
}) {
  const sampleId = (await params).sampleId;
  
  const sample = await getSampleById(sampleId);
  
  if (!sample) {
    return (
      <Base>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Sample not found</h1>
            <p className="text-muted-foreground">The sample you're looking for doesn't exist.</p>
          </div>
        </div>
      </Base>
    );
  }
  
  const patient = await getPatientById(sample.patientId);
  
  if (!patient) {
    return (
      <Base>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Patient not found</h1>
            <p className="text-muted-foreground">The patient associated with this sample doesn't exist.</p>
          </div>
        </div>
      </Base>
    );
  }
  
  // Get the profile that created the sample (user who created it)
  const createdByProfile = await getProfileByUserId(sample.createdBy);
  
  // Get the profile that uploaded the sample image (if different from createdBy)
  const uploadedByProfile = sample.uploadedBy 
    ? await getProfileByUserId(sample.uploadedBy)
    : createdByProfile;
  
  const role = uploadedByProfile?.roleId ? await getRoleById(uploadedByProfile.roleId) : null;

  return (
    <Base>
      <SamplePageWrapper 
        sample={sample}
        patient={patient}
        profile={uploadedByProfile || createdByProfile}
        roleName={role?.name || null}
        disabled={false} 
      />
    </Base>
  );
}
