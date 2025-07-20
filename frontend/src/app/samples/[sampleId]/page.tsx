import {
  getMetaSampleImagesBySampleId,
  getSampleById
} from "@/db/queries/select";
import { redirect } from "next/navigation";

const SamplePage = async ({
  params,
}: {
  params: Promise<{ sampleId: string }>;
}) => {
  const sampleId = (await params).sampleId;
  const sample = await getSampleById(sampleId);
  const sampleImages = await getMetaSampleImagesBySampleId(sample.id);

  if (!sampleImages.length) {
    // Optionally render a fallback UI if no images
    return <div>No images found for this sample.</div>;
  }

  // Redirect to the first sample image
  redirect(`/samples/${sampleId}/${sampleImages[0].id}`);
};

export default SamplePage;
