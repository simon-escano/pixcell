import Base from "@/components/base";
import { isDoctorAssociatedWithPatient } from "@/db/queries/select";
import { getUser } from "@/lib/auth";
import { getMetaSampleById, getMetaSampleImagesBySampleId } from "../../queries";
import SamplePageWrapper from "./wrapper";

const SampleImagePage = async ({
  params,
}: {
  params: Promise<{ sampleId: string; sampleImageId: string }>;
}) => {
  const { sampleId, sampleImageId } = await params;
  const sample = await getMetaSampleById(sampleId);
  const sampleImages = await getMetaSampleImagesBySampleId(sample!.id);
  const currentUser = await getUser();
  const isDoctorAssociated = await isDoctorAssociatedWithPatient(currentUser.id, sample!.patient?.id!);

  const canEdit = currentUser.role === "Administrator" || isDoctorAssociated || sample!.createdBy?.id === currentUser.id;

  return (
    <Base>
      <SamplePageWrapper
        sample={sample}
        sampleImages={sampleImages}
        selectedSampleImageId={sampleImageId}
        canEdit={canEdit}
      />
    </Base>
  );
};

export default SampleImagePage;
