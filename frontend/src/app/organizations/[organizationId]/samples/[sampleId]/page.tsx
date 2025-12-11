import {
  getSampleById
} from "@/db/queries/select";
import { redirect } from "next/navigation";
import { getMetaSampleImagesBySampleId, getMetaProfileByUserId } from "../queries";
import { getUser } from "@/lib/auth";
import { isDoctorAssociatedWithPatient } from "@/db/queries/select";
import AccessDeniedToast from "./[sampleImageId]/access-denied-toast";
import Base from "@/components/base";
import { Metadata } from "next";

function truncate(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sampleId: string; organizationId: string }>;
}): Promise<Metadata> {
  const paramsObj = await params;
  const sample = await getSampleById(paramsObj.sampleId);
  const sampleName = sample?.sampleName 
    ? truncate(sample.sampleName)
    : "Sample";
  
  return {
    title: `PixCell | ${sampleName}`,
  };
}

const SamplePage = async ({
  params,
}: {
  params: Promise<{ sampleId: string; organizationId: string }>;
}) => {
  const paramsObj = await params;
  const sampleId = paramsObj.sampleId;
  const organizationId = paramsObj.organizationId;
  const sample = await getSampleById(sampleId);
  
  // Check if sample exists
  if (!sample) {
    return (
      <Base params={paramsObj}>
        <AccessDeniedToast message="You have no access to this image or the image does not exist" />
      </Base>
    );
  }
  
  const currentUser = await getUser();
  const metaUser = await getMetaProfileByUserId(currentUser.id, organizationId);
  const isDoctorAssociated = await isDoctorAssociatedWithPatient(currentUser.id, sample.patientId);

  // SECURITY FIX: Check if user has access to view this sample
  const hasAccess = metaUser?.role === "Administrator" || 
                   isDoctorAssociated || 
                   sample.createdBy === currentUser.id;

  // If user doesn't have access, show toast and redirect
  if (!hasAccess) {
    return (
      <Base params={paramsObj}>
        <AccessDeniedToast message="You have no access to this image or the image does not exist" />
      </Base>
    );
  }
  
  const sampleImages = await getMetaSampleImagesBySampleId(sample.id);

  if (!sampleImages.length) {
    // Optionally render a fallback UI if no images
    return <div>No images found for this sample.</div>;
  }

  // Redirect to the first sample image (organization-scoped)
  if (organizationId) {
    redirect(`/organizations/${organizationId}/samples/${sampleId}/${sampleImages[0].id}`);
  } else {
    redirect(`/samples/${sampleId}/${sampleImages[0].id}`);
  }
};

export default SamplePage;
