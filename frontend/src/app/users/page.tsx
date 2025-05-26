import Base from "@/components/base";
import { DataTable } from "@/components/data-table";
import { UsersTable } from "@/components/users/users-table";
import { getAllUsersWithProfiles, getAllRoles } from "@/db/queries/select";
import { getUser } from "@/lib/auth";
import { getProfileByUserId, getRoleById } from "@/db/queries/select";
import { redirect } from "next/navigation";

export default async function OtherUsersPage() {
  const user = await getUser();
  const profile = await getProfileByUserId(user.id);
  const role = await getRoleById(profile.roleId);

  // Redirect non-administrators to home page
  if (role.name !== "Administrator") {
    redirect("/");
  }

  const usersData = await getAllUsersWithProfiles();
  const rolesData = await getAllRoles();

  // Transform the data to match CombinedUser type by providing default values for nullable fields
  const users = usersData.map((user) => ({
    ...user,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    imageUrl: user.imageUrl || "",
    roleId: user.roleId || "",
    phone: user.phone || "",
    roleName: user.roleName || "",
  }));

  return (
    <Base>
      <div className="h-full overflow-y-auto p-4 sm:p-8">
        <UsersTable users={users} roles={rolesData} />
      </div>
    </Base>
  );
}

export const metadata = {
  title: "Other Users - PixCell",
};
