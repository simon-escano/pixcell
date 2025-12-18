import Base from "@/components/base";
import { isDoctorAssociatedWithPatient } from "@/db/queries/select";
import { getUser } from "@/lib/auth";
import SamplePageWrapper from "./wrapper";
import { redirect } from "next/navigation";
import AccessDeniedToast from "./access-denied-toast";
import { getMetaProfileByUserId, getMetaSampleById, getMetaSampleImagesBySampleId } from "../../queries";
import { Metadata } from "next";
import AccessDeniedPage from "@/components/access-denied-page";
import { getSampleById, getSampleImageAiByOriginalId } from "@/db/queries/select";

function truncate(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sampleId: string; sampleImageId: string; organizationId?: string }>;
}): Promise<Metadata> {
  const paramsObj = await params;
  const sample = await getMetaSampleById(paramsObj.sampleId);
  const sampleName = sample?.sampleName 
    ? truncate(sample.sampleName)
    : "Sample";
  
  return {
    title: `PixCell | ${sampleName}`,
  };
}

const SampleImagePage = async ({
  params,
}: {
  params: Promise<{ sampleId: string; sampleImageId: string; organizationId?: string }>;
}) => {
  const paramsObj = await params;
  const { sampleId, sampleImageId } = paramsObj;
  const organizationId = paramsObj.organizationId;
  
  // Check organization membership first using getSampleById which includes organizationId
  const sampleData = await getSampleById(sampleId);
  if (!sampleData) {
    return (
      <Base params={paramsObj}>
        <AccessDeniedToast message="You have no access to this image or the image does not exist" />
      </Base>
    );
  }

  // Check if sample belongs to the organization
  if (sampleData.organizationId !== organizationId) {
    return (
      <Base params={paramsObj}>
        <AccessDeniedPage 
          message="This sample does not exist in this organization."
          backUrl={`/organizations/${organizationId}/samples`}
          backLabel="Back to Samples"
        />
      </Base>
    );
  }

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

  // Fetch AI images for all sample images
  const aiImagesRecord: Record<string, string | null> = {};
  await Promise.all(
    sampleImages.map(async (img) => {
      const aiImage = await getSampleImageAiByOriginalId(img.id);
      aiImagesRecord[img.id] = aiImage?.imageUrl || null;
    })
  );

  return (
    <Base params={paramsObj}>
      <SamplePageWrapper
        sample={sample}
        sampleImages={sampleImages}
        selectedSampleImageId={sampleImageId}
        canEdit={canEdit}
        aiImagesRecord={aiImagesRecord}
      />
    </Base>
  );
};

export default SampleImagePage;
