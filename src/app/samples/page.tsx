import Base from "@/components/base";
import SampleWrapper from "@/components/sample-wrapper";
import { getSamples } from "@/db/queries/select";

export default async function SamplesPage() {
  const samples = await getSamples();
  return (
    <Base>
      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {samples.map(async (sample) => (
          <SampleWrapper key={sample.id} sample={sample} />
        ))}
      </div>
    </Base>
  );
}
