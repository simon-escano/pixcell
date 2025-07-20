import Base from "@/components/base";
import { getProfileByUserId, getReportsByGeneratedBy, getRoleById, getSamplesByUserId, getUserById } from "@/db/queries/select";
import { getMetaProfileByUserId, getMetaSampleImagesBySampleId } from "@/app/samples/queries";
import UserProfileClient from "./UserProfileClient";

export default async function UserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const userId = (await params).userId;
  const user = await getUserById(userId);
  const profile = await getProfileByUserId(userId);
  const samples = await getSamplesByUserId(userId);
  const reports = await getReportsByGeneratedBy(userId);
  const role = (await getRoleById(profile.roleId)).name;
  const metaUser = await getMetaProfileByUserId(userId);

  // Fetch sample images for each sample
  const samplesWithImages = await Promise.all(
    samples.map(async (sample) => ({
      ...sample,
      sampleImages: await getMetaSampleImagesBySampleId(sample.id),
    }))
  );

  return (
    <Base>
      <UserProfileClient
        user={user}
        profile={profile}
        role={role}
        samples={samplesWithImages}
        reports={reports}
        metaUser={metaUser}
      />
    </Base>
  );
}
