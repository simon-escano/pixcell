import Base from "@/components/base";
import { getUser } from "@/lib/auth";
import { getProfileByUserId, getRoleById } from "@/db/queries/select";
import { Dashboard } from "@/components/dashboard/dashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";

export default async function Page() {
  const user = await getUser();
  const profile = await getProfileByUserId(user.id);
  const role = await getRoleById(profile.roleId);

  return (
    <Base>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-12">
        {role.name === "Administrator" ? (
          <AdminDashboard />
        ) : (
          <Dashboard
            userProfile={{
              firstName: profile.firstName,
              lastName: profile.lastName,
              imageUrl: profile.imageUrl,
            }}
            userRole={role.name}
            userId={user.id}
          />
        )}
      </div>
    </Base>
  );
}
