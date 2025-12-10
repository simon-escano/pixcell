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
  getOrganizationsByProfileId,
  getProfileByUserId,
  getRoleById
} from "@/db/queries/select";
import { getUser } from "@/lib/auth";
import Link from "next/link";
import { NavSecondaryWrapper } from "../nav-secondary-wrapper";
import PixCellLogo from "../pixcell-logo";

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const user = await getUser();
  const profileData = await getProfileByUserId(user.id);
  const profileRoleData = profileData?.roleId ? await getRoleById(profileData.roleId) : null;
  const organizations = await getOrganizationsByProfileId(profileData?.id || "");

  const profileRole = profileRoleData?.name || null;
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
        <NavMain />
      </SidebarContent>
      <NavSecondaryWrapper />
      <NavTertiary />
      <SidebarFooter>
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground px-2 py-2">Organizations</p>
          <ul className="space-y-1 px-2">
            {organizations.map((org) => (
              <li key={org.id} className="text-sm text-foreground truncate">
                {org.address}
              </li>
            ))}
          </ul>
        </div>
        <NavUser user={user} profile={profileDataWithLicense} role={profileRole} />
      </SidebarFooter>
    </Sidebar>
  );
}
