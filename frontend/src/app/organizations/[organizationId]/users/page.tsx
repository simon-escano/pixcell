import Base from "@/components/base";
import { UsersTable } from "@/components/users/users-table";
import { getAllRoles, getAllUsersWithProfiles, getProfileByUserId, getRoleByUserIdAndOrganizationId } from "@/db/queries/select";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OtherUsersPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const paramsObj = await params;
  const organizationId = paramsObj.organizationId;
  const user = await getUser();
  const profile = await getProfileByUserId(user.id);
  const role = await getRoleByUserIdAndOrganizationId(user.id, organizationId);

  // Redirect non-administrators to organization dashboard
  if (!role || role.name !== "Administrator") {
    redirect(`/organizations/${organizationId}`);
  }

  const usersData = await getAllUsersWithProfiles(organizationId);
  const rolesData = await getAllRoles();

  // Transform the data to match CombinedUser type by providing default values for nullable fields
  const users = usersData.map((user) => ({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    roleName: user.roleName || "",
    roleId: user.roleId || "",
    phone: user.phone || "",
    id: user.id,
    imageId: user.imageId || null,
    imageUrl: user.imageUrl || null,
  }));

  return (
    <Base params={paramsObj}>
      <div className="h-full overflow-y-auto p-4 sm:p-8">
        <UsersTable users={users} organizationId={organizationId} />
      </div>
    </Base>
  );
}

export const metadata = {
  title: "Manage Users - PixCell",
};
