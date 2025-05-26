import { getUser } from "@/lib/auth";
import { getProfileByUserId, getRoleById } from "@/db/queries/select";
import { NavSecondary } from "./nav-secondary";

export async function NavSecondaryWrapper() {
  const user = await getUser();
  const profile = await getProfileByUserId(user.id);
  const role = await getRoleById(profile.roleId);
  const isAdmin = role.name === "Administrator";

  return <NavSecondary isAdmin={isAdmin} />;
} 