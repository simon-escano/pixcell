import Base from "@/components/base";
import { isDoctorAssociatedWithPatient } from "@/db/queries/select";
import { getUser } from "@/lib/auth";
import SamplePageWrapper from "./wrapper";
import { redirect } from "next/navigation";
import AccessDeniedToast from "./access-denied-toast";
import { getMetaProfileByUserId, getMetaSampleById, getMetaSampleImagesBySampleId } from "../../queries";

const SampleImagePage = async ({
  params,
}: {
  params: Promise<{ sampleId: string; sampleImageId: string; organizationId?: string }>;
}) => {
  const paramsObj = await params;
  const { sampleId, sampleImageId } = paramsObj;
  const sample = await getMetaSampleById(sampleId);
  
  // Check if sample exists
  if (!sample) {
    return (
      <Base params={paramsObj}>
        <AccessDeniedToast message="You have no access to this image or the image does not exist" />
      </Base>
    );
  }
  
  const sampleImages = await getMetaSampleImagesBySampleId(sample.id);
  const currentUser = await getUser();
  const organizationId = paramsObj.organizationId;
  const metaUser = await getMetaProfileByUserId(currentUser.id, organizationId);
  const isDoctorAssociated = await isDoctorAssociatedWithPatient(currentUser.id, sample.patient?.id!);

  // SECURITY FIX: Check if user has access to view this sample
  const hasAccess = metaUser?.role === "Administrator" || 
                   isDoctorAssociated || 
                   sample.createdBy?.id === currentUser.id;

  // If user doesn't have access, show toast and redirect
  if (!hasAccess) {
    return (
      <Base params={paramsObj}>
        <AccessDeniedToast message="You have no access to this image or the image does not exist" />
      </Base>
    );
  }

  const canEdit = metaUser?.role === "Administrator" || isDoctorAssociated || sample.createdBy?.id === currentUser.id;

  return (
    <Base params={paramsObj}>
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
