import {
  getAllSamples,
} from "@/db/queries/select";
import SampleCard from "./components/sample-card";
import { getMetaProfileByUserId, getMetaSampleById, getMetaSampleImagesBySampleId } from "./queries";
import Base from "@/components/base";
import { getUser } from "@/lib/auth";

const SamplesPage = async () => {
  const currentUser = await getUser();
  const metaUser = await getMetaProfileByUserId(currentUser.id);
  const samples = await getAllSamples();

  return (
    <Base>
      <div className="grid w-full grid-cols-2 gap-4 p-4 sm:grid-cols-3 sm:p-8 md:grid-cols-4 lg:grid-cols-5">
        {samples.map(async (sample) => {
          const metaSample = await getMetaSampleById(sample.id);
          const metaSampleImages = await getMetaSampleImagesBySampleId(sample.id);
          return <SampleCard currentUser={metaUser!} sampleImages={metaSampleImages} sample={metaSample!} />;
        })}
      </div>
    </Base>
  );
};

export default SamplesPage;
