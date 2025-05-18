import Base from "@/components/base";
import { DataTable } from "@/components/data-table";
import { UsersTable } from "@/components/users-table";
import { getAllUsersWithProfiles } from "@/db/queries/select";

export default async function OtherUsersPage() {
  const usersData = await getAllUsersWithProfiles();

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
      <div className="h-full overflow-y-auto p-4">
        <UsersTable users={users} />
      </div>
    </Base>
  );
}

export const metadata = {
  title: "Other Users - PixCell",
};
