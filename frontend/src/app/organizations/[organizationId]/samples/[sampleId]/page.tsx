import {
  getSampleById
} from "@/db/queries/select";
import { redirect } from "next/navigation";
import { getMetaSampleImagesBySampleId, getMetaProfileByUserId } from "../queries";
import { getUser } from "@/lib/auth";
import { isDoctorAssociatedWithPatient } from "@/db/queries/select";
import AccessDeniedToast from "./[sampleImageId]/access-denied-toast";
import Base from "@/components/base";

const SamplePage = async ({
  params,
}: {
  params: Promise<{ sampleId: string }>;
}) => {
  const sampleId = (await params).sampleId;
  const sample = await getSampleById(sampleId);
  
  // Check if sample exists
  if (!sample) {
    return (
      <Base>
        <AccessDeniedToast message="You have no access to this image or the image does not exist" />
      </Base>
    );
  }
  
  const currentUser = await getUser();
  const metaUser = await getMetaProfileByUserId(currentUser.id);
  const isDoctorAssociated = await isDoctorAssociatedWithPatient(currentUser.id, sample.patientId);

  // SECURITY FIX: Check if user has access to view this sample
  const hasAccess = metaUser?.role === "Administrator" || 
                   isDoctorAssociated || 
                   sample.createdBy === currentUser.id;

  // If user doesn't have access, show toast and redirect
  if (!hasAccess) {
    return (
      <Base>
        <AccessDeniedToast message="You have no access to this image or the image does not exist" />
      </Base>
    );
  }
  
  const sampleImages = await getMetaSampleImagesBySampleId(sample.id);

  if (!sampleImages.length) {
    // Optionally render a fallback UI if no images
    return <div>No images found for this sample.</div>;
  }

  // Redirect to the first sample image
  redirect(`/samples/${sampleId}/${sampleImages[0].id}`);
};

export default SamplePage;
