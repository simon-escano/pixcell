import Base from "@/components/base";
import SampleWrapper from "@/components/samples/sample-wrapper";
import { getAllSamples } from "@/db/queries/select";

export default async function SamplesPage() {
  const user = await getUser();
  const profile = await getProfileByUserId(user.id);
  const role = await getRoleById(profile.roleId);
  
  // If user is admin, show all samples, otherwise show only user's samples
  const samples = role.name === "Administrator" 
    ? await getAllSamples()
    : await getSamplesByUserId(user.id);

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
