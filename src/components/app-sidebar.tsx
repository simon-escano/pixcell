import type * as React from "react";
import { Command } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavRecents } from "@/components/nav-recents";
import { NavTertiary } from "@/components/nav-tertiary";
import { NavUser } from "@/components/nav-user";
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
import db from "@/db";
import { profile, role } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const user = await getUser();
  const userProfile = await db
    .select()
    .from(profile)
    .where(eq(profile.userId, user.id))
    .limit(1);

  const profileData = userProfile[0] || null;
  const profileRoleData = await db
    .select()
    .from(role)
    .where(eq(role.id, profileData.roleId))
    .limit(1);

  const profileRole = profileRoleData[0]?.name || null;
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
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
        <NavRecents />
        <NavSecondary />
        <NavTertiary className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} profile={profileData} role={profileRole} />
      </SidebarFooter>
    </Sidebar>
  );
}
