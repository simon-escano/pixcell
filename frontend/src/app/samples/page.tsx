import {
  getAllSamples,
} from "@/db/queries/select";
import SampleCard from "./components/sample-card";
import { getMetaSampleById } from "./queries";

const SamplesPage = async () => {
  const samples = await getAllSamples();

  return (
    <div className="grid w-full grid-cols-2 gap-4 p-4 sm:grid-cols-3 sm:p-8 md:grid-cols-4 lg:grid-cols-5">
      {samples.map(async (sample) => {
        const metaSample = await getMetaSampleById(sample.id);
        return <SampleCard sample={metaSample!} />;
      })}
    </div>
  );
};

export default SamplesPage;
