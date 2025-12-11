import Base from "@/components/base";
import { getProfileByUserId, getReportsByGeneratedBy, getRoleByUserIdAndOrganizationId, getSamplesByUserId, getUserById, getAllPatientsForUser } from "@/db/queries/select";
import UserProfileClient from "./UserProfileClient";
import { getMetaProfileByUserId, getMetaSampleImagesBySampleId } from "@/app/organizations/[organizationId]/samples/queries";
import { Metadata } from "next";

function truncate(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string; organizationId: string }>;
}): Promise<Metadata> {
  const paramsObj = await params;
  const profile = await getProfileByUserId(paramsObj.userId);
  const userName = profile 
    ? truncate(`${profile.firstName} ${profile.lastName}`)
    : "User";
  
  return {
    title: `PixCell | ${userName}`,
  };
}

export default async function UserPage({
  params,
}: {
  params: Promise<{ userId: string, organizationId: string }>;
}) {
  const paramsObj = await params;
  const userId = paramsObj.userId;
  const organizationId = paramsObj.organizationId;
  const user = await getUserById(userId);
  const profile = await getProfileByUserId(userId);
  const samples = await getSamplesByUserId(userId, organizationId);
  const reports = await getReportsByGeneratedBy(userId);
  const roleData = await getRoleByUserIdAndOrganizationId(userId, organizationId);
  const role = roleData?.name || "";
  const roleId = roleData?.id || "";
  const metaUser = await getMetaProfileByUserId(userId, organizationId);

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
    <Base params={paramsObj}>
      <UserProfileClient
        user={user}
        profile={profile}
        role={role}
        roleId={roleId}
        organizationId={organizationId}
        samples={samplesWithImages}
        reports={reports}
        metaUser={metaUser}
        patients={patients}
      />
    </Base>
  );
}
