"use client";

import {
  UsersRound
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavSecondaryProps {
  isAdmin: boolean;
  organizationId?: string;
}

export function NavSecondary({ isAdmin, organizationId }: NavSecondaryProps) {
  const pathname = usePathname();
  
  // If no valid organization ID, hide the menu
  if (!organizationId || typeof organizationId !== "string" || organizationId.trim() === "") {
    return null;
  }

  const items = [
    ...(isAdmin ? [{
      title: "Manage users",
      url: `/organizations/${organizationId}/members`,
      icon: UsersRound,
    }] : []),
  ];

  if (!isAdmin) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Administration</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.url || pathname?.startsWith(item.url + "/");
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
