import { getUser } from "@/lib/auth";
import { getMetaSampleById, getMetaSampleImagesBySampleId } from "../../queries";
import SamplePageWrapper from "./wrapper";
import Base from "@/components/base";

const SampleImagePage = async ({
  params,
}: {
  params: Promise<{ sampleId: string; sampleImageId: string }>;
}) => {
  const { sampleId, sampleImageId } = await params;
  const sample = await getMetaSampleById(sampleId);
  const sampleImages = await getMetaSampleImagesBySampleId(sample!.id);
  const currentUser = await getUser();

  return (
    <Base>
    <SamplePageWrapper
      currentUser={currentUser}
      sample={sample}
      sampleImages={sampleImages}
      selectedSampleImageId={sampleImageId}
    /></Base>
  );
};

export default SampleImagePage;
