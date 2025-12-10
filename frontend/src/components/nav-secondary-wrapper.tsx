import { getUser } from "@/lib/auth";
import { getProfileByUserId, getRoleById, getOrganizationsByProfileId } from "@/db/queries/select";
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
  
  // Get organizationId from params or fallback to first organization
  const resolvedParams = params ? await params : null;
  const organizations = await getOrganizationsByProfileId(profile?.id || "");
  const organizationId = resolvedParams?.organizationId || organizations[0]?.id || undefined;

  return <NavSecondary isAdmin={isAdmin} organizationId={organizationId} />;
} 