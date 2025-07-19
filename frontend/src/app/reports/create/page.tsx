import Base from "@/components/base";
import { getAllPatientsForUser, getAllProfiles, getProfileByUserId, getRoleById } from "@/db/queries/select";
import { getUser } from "@/lib/auth";
import CreateReportForm from "@/components/reports/create-report-form";

export default async function CreateReportPage() {
  const user = await getUser();
  const profile = await getProfileByUserId(user.id);
  const role = await getRoleById(profile.roleId);
  
  // Get patients based on user role
  const patients = await getAllPatientsForUser(profile.id, role.name);
  const profiles = await getAllProfiles();

  return (
    <Base>
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