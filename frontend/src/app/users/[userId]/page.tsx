import Base from "@/components/base";
import { getProfileByUserId, getReportsByGeneratedBy, getRoleById, getSamplesByUserId, getUserById, getAllPatientsForUser } from "@/db/queries/select";
import UserProfileClient from "./UserProfileClient";
import { getMetaProfileByUserId, getMetaSampleImagesBySampleId } from "@/app/organizations/[organizationId]/samples/queries";

export default async function UserPage({
  params,
}: {
  params: Promise<{ userId: string, organizationId: string }>;
}) {
  const userId = (await params).userId;
  const organizationId = (await params).organizationId;
  const user = await getUserById(userId);
  const profile = await getProfileByUserId(userId);
  const samples = await getSamplesByUserId(userId, organizationId);
  const reports = await getReportsByGeneratedBy(userId);
  const role = (await getRoleById(profile.roleId)).name;
  const metaUser = await getMetaProfileByUserId(userId);

  // Fetch patients for this user
  const patients = await getAllPatientsForUser(profile.id, role, organizationId);

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
        patients={patients}
      />
    </Base>
  );
}
