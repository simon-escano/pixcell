import Base from "@/components/base";
import { DataTable } from "@/components/data-table";
import { UsersTable } from "@/components/users-table";
import { getAllUsersWithProfiles } from "@/db/queries/select";

export default async function OtherUsersPage() {
  const usersData = await getAllUsersWithProfiles();

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
  }));

  return (
    <Base>
      <div className="h-full overflow-y-auto p-4 sm:p-8">
        <UsersTable users={users} />
      </div>
    </Base>
  );
}

export const metadata = {
  title: "Other Users - PixCell",
};
