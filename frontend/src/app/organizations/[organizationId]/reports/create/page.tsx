import Base from "@/components/base";
import { getAllPatientsForUser, getAllProfiles, getProfileByUserId, getRoleByUserIdAndOrganizationId } from "@/db/queries/select";
import { getUser } from "@/lib/auth";
import CreateReportForm from "@/components/reports/create-report-form";

export const metadata = {
  title: "PixCell | Create Report",
};

export default async function CreateReportPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const paramsObj = await params;
  const organizationId = paramsObj.organizationId;
  const user = await getUser();
  const profile = await getProfileByUserId(user.id);
  const role = await getRoleByUserIdAndOrganizationId(user.id, organizationId);
  
  // Get patients based on user role
  const patientsRaw = await getAllPatientsForUser(profile.id, role?.name || "", organizationId, true);
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
    <Base params={paramsObj}>
      <div className="h-full overflow-y-auto p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">

          <CreateReportForm 
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