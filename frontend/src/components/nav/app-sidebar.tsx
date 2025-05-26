import type * as React from "react";
import { Command, Worm } from "lucide-react";

import { NavMain } from "@/components/nav/nav-main";
import { NavRecents } from "@/components/nav/nav-recents";
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
import Link from "next/link";
import { NavSecondary } from "./nav-secondary";
import { getUser } from "@/lib/auth";
import {
  getProfileByUserId,
  getRecentUploads,
  getRoleById,
} from "@/db/queries/select";

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const user = await getUser();
  const profileData = await getProfileByUserId(user.id);
  const profileRoleData = await getRoleById(profileData.roleId);
  const recentSamples = await getRecentUploads();

  const profileRole = profileRoleData.name || null;
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Worm className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">PixCell</span>
                  <span className="truncate text-xs">Premium Plan</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavRecents recentSamples={recentSamples} />
        <NavSecondary />
        <NavTertiary className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} profile={profileData} role={profileRole} />
      </SidebarFooter>
    </Sidebar>
  );
}
