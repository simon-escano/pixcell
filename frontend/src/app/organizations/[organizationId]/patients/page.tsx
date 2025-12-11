import Base from "@/components/base";
import PatientsTable from "@/components/patients/patients-table";
import { getAllPatientsForUser, getProfileByUserId, getRoleByUserIdAndOrganizationId } from "@/db/queries/select";
import { getUser } from "@/lib/auth";

export default async function PatientsPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const paramsObj = await params;
  const organizationId = paramsObj.organizationId;
  const user = await getUser();
  const profile = await getProfileByUserId(user.id);
  const role = await getRoleByUserIdAndOrganizationId(user.id, organizationId);
  const patients = await getAllPatientsForUser(profile.id, role?.name || "", organizationId);

  return (
    <Base params={paramsObj}>
      <div className="h-full overflow-y-auto p-4 sm:p-8">
        <PatientsTable patients={patients.map(p => ({ ...p, createdBy: null }))} />
      </div>
    </Base>
  );
}

export const metadata = {
  title: "Patients - PixCell",
};
