import Base from "@/components/base";
import SampleWrapper from "@/components/samples/sample-wrapper";
import { getAllSamples } from "@/db/queries/select";

export default async function SamplesPage() {
  const samples = await getAllSamples();
  return (
    <Base>
      <div className="grid w-full grid-cols-2 gap-4 p-4 sm:grid-cols-3 sm:p-8 md:grid-cols-4 lg:grid-cols-5">
        {samples.map(async (sample) => (
          <SampleWrapper key={sample.id} sample={sample} />
        ))}
      </div>
    </Base>
  );
}
