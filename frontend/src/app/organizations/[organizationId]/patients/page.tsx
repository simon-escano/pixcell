import Base from "@/components/base";
import PatientsList from "@/components/patients/patients-list";
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
  const isAdmin = role?.name === "Administrator";

  return (
    <Base params={paramsObj}>
      <div className="h-full overflow-y-auto relative">
        <PatientsList patients={patients.map(p => ({ ...p, createdBy: null }))} organizationId={organizationId} isAdmin={isAdmin} />
      </div>
    </Base>
  );
}

export const metadata = {
  title: "PixCell | Patients",
};
