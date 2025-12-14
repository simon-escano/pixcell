"use client";

import { Collapsible } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ContactRound, FileText, Images, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavMainProps {
  organizationId?: string;
}

export function NavMain({ organizationId }: NavMainProps) {
  const pathname = usePathname();
  
  // If no valid ID is found, hide the menu
  if (!organizationId || typeof organizationId !== "string" || organizationId.trim() === "") {
    return null;
  }

  const items = [
    {
      title: "Patients",
      url: `/organizations/${organizationId}/patients`,
      icon: ContactRound,
    },
    {
      title: "Samples",
      url: `/organizations/${organizationId}/samples`,
      icon: Images,
    },
    {
      title: "Reports",
      url: `/organizations/${organizationId}/reports`,
      icon: FileText,
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Organization</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.url || pathname?.startsWith(item.url + "/");
          return (
            <Collapsible key={item.title} asChild defaultOpen={isActive}>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}