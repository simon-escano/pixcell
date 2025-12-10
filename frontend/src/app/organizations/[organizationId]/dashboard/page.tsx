import Base from "@/components/base";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import { Dashboard } from "@/components/dashboard/dashboard";
import { getProfileByUserId, getRoleById } from "@/db/queries/select";
import { getUser } from "@/lib/auth";

export default async function Page({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const organizationId = (await params).organizationId;
  const user = await getUser();
  const profile = await getProfileByUserId(user.id);
  const role = await getRoleById(profile.roleId);

  return (
    <Base>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-12">
        {role.name === "Administrator" ? (
          <AdminDashboard profileId={profile.id} organizationId={organizationId} />
        ) : (
          <Dashboard
            userProfile={{
              firstName: profile.firstName,
              lastName: profile.lastName,
              imageUrl: profile.imageUrl,
            }}
            userRole={role.name}
            organizationId={organizationId}
          />
        )}
      </div>
    </Base>
  );
}
