import type * as React from "react";

import { NavMain } from "@/components/nav/nav-main";
import { NavTertiary } from "@/components/nav/nav-tertiary";
import { NavUser } from "@/components/nav/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  getAllPatientsForUser,
  getOrganizationsByProfileId,
  getProfileByUserId,
  getRoleByUserIdAndOrganizationId
} from "@/db/queries/select";
import { getUser } from "@/lib/auth";
import Link from "next/link";
import { NavSecondaryWrapper } from "../nav-secondary-wrapper";
import OrganizationDropdown from "../organization-dropdown";
import PixCellLogo from "../pixcell-logo";
import UploadSampleWrapper from "../samples/upload-sample-wrapper";

// 1. Update the props type definition to include params
export async function AppSidebar({
  params, 
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  params?: Promise<{ organizationId: string }>;
}) {
  const user = await getUser();
  const profileData = await getProfileByUserId(user.id);
  const organizations = await getOrganizationsByProfileId(profileData?.id || "");
  
  // 2. Logic Fix: await the params safely
  // We'll keep two values:
  // - organizationIdFromUrl: only present when the URL contains the param (used to show/hide nav)
  // - selectedOrganizationId: the resolved selection (URL param fallback to first org)
  const resolvedParams = params ? await params : null;
  const organizationIdFromUrl = resolvedParams?.organizationId || undefined;
  const selectedOrganizationId = organizationIdFromUrl || organizations[0]?.id || undefined;

  // Get role for the selected organization
  const profileRoleData = selectedOrganizationId ? await getRoleByUserIdAndOrganizationId(user.id, selectedOrganizationId) : null;

  // Fetch patients for the selected organization
  const patientsRaw = selectedOrganizationId && profileData?.id && profileRoleData?.name
    ? await getAllPatientsForUser(profileData.id, profileRoleData.name, selectedOrganizationId)
    : [];  const profileRole = profileRoleData?.name || null;
  const profileDataWithLicense = { ...profileData, licenseNo: profileData.licenseNo ?? null };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <PixCellLogo />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">PixCell</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <OrganizationDropdown organizations={organizations} />
        {organizationIdFromUrl && (
          <div className="flex flex-col gap-2 mb-2 px-2">
            <UploadSampleWrapper organizationId={organizationIdFromUrl} patientsRaw={patientsRaw} />
          </div>
        )}
        <NavMain 
          organizationId={organizationIdFromUrl}
        />
      </SidebarContent>
      <NavSecondaryWrapper params={params} />
      <NavTertiary />
      <SidebarFooter>
        <NavUser user={user} profile={profileDataWithLicense} role={profileRole} />
      </SidebarFooter>
    </Sidebar>
  );
}