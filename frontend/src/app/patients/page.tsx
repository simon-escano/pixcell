import Base from "@/components/base";
import PatientsTable from "@/components/patients/patients-table";
import { getUser } from "@/lib/auth";
import { getAllPatientsForUser, getRoleById, getProfileByUserId} from "@/db/queries/select";

export default async function PatientsPage() {
  const user = await getUser();
  const profile = await getProfileByUserId(user.id);
  const role = await getRoleById(profile.roleId);
  const patients = await getAllPatientsForUser(profile.id,role.name);

  return (
    <Base>
      <div className="h-full overflow-y-auto p-4 sm:p-8">
        <PatientsTable patients={patients.map(p => ({ ...p, createdBy: null }))} />
      </div>
    </Base>
  );
}

export const metadata = {
  title: "Patients - PixCell",
};
