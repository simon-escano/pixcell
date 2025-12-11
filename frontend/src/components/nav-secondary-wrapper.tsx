import { getUser } from "@/lib/auth";
import { getProfileByUserId, getRoleById } from "@/db/queries/select";
import { NavSecondary } from "./nav/nav-secondary";

export async function NavSecondaryWrapper({
  params,
}: {
  params?: Promise<{ organizationId: string }>;
}) {
  const user = await getUser();
  const profile = await getProfileByUserId(user.id);
  const role = await getRoleById(profile.roleId);
  const isAdmin = role.name === "Administrator";

  // Use only the organizationId present in the URL params; do NOT fallback.
  const resolvedParams = params ? await params : null;
  const organizationId = resolvedParams?.organizationId || undefined;

  return <NavSecondary isAdmin={isAdmin} organizationId={organizationId} />;
}