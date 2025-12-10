import Base from "@/components/base";
import { getAllPatientsForUser, getAllProfiles, getProfileByUserId, getRoleById } from "@/db/queries/select";
import { getUser } from "@/lib/auth";
import ClientCreateReportForm from "./ClientCreateReportForm";

export default async function AiGenerateReportPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const organizationId = (await params).organizationId;
  const user = await getUser();
  const profile = await getProfileByUserId(user.id);
  const role = await getRoleById(profile.roleId);
  
  // Get patients based on user role
  const patientsRaw = await getAllPatientsForUser(profile.id, role.name, organizationId, true);
  let patients = patientsRaw.map((p: any) => ({
    ...p,
    fullName: `${p.firstName} ${p.lastName}`,
    role: p.role ?? "Patient",
    createdBy: p.createdBy ?? profile?.id ?? "",
  }));
  let profiles = (await getAllProfiles()).map((p: any) => {
    if (p.imageId === null) {
      const { imageId, ...rest } = p;
      return rest;
    }
    return p;
  });

  return (
    <Base>
      <div className="h-full overflow-y-auto p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <ClientCreateReportForm
            patients={patients}
            currentUserId={user.id}
            profiles={profiles}
            role={role}
          />
        </div>
      </div>
    </Base>
  );
} 