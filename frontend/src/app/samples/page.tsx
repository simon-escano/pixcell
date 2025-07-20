import {
  getAllSamples,
} from "@/db/queries/select";
import SampleCard from "./components/sample-card";
import { getMetaSampleById, getMetaSampleImagesBySampleId } from "./queries";
import Base from "@/components/base";

const SamplesPage = async () => {
  const samples = await getAllSamples();

  return (
    <Base>
      <div className="grid w-full grid-cols-2 gap-4 p-4 sm:grid-cols-3 sm:p-8 md:grid-cols-4 lg:grid-cols-5">
        {samples.map(async (sample) => {
          console.log(sample.id);
          const metaSample = await getMetaSampleById(sample.id);
          const metaSampleImages = await getMetaSampleImagesBySampleId(sample.id);
          return <SampleCard sampleImages={metaSampleImages} sample={metaSample!} />;
        })}
      </div>
    </Base>
  );
};

export default SamplesPage;
