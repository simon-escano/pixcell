"use client";

import React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ContactRound, FileText, Images, Building, ChevronRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Organization {
  id: string;
  name: string | null;
  color: string;
}

interface NavMainProps {
  organizations: Organization[];
}

export function NavMain({ organizations }: NavMainProps) {
  const pathname = usePathname();
  const [openStates, setOpenStates] = React.useState<Record<string, boolean>>(
    organizations.reduce((acc, org) => {
      acc[org.id] = true; // All open by default
      return acc;
    }, {} as Record<string, boolean>)
  );

  if (!organizations || organizations.length === 0) {
    return null;
  }

  const menuItems = [
    {
      title: "Patients",
      url: (orgId: string) => `/organizations/${orgId}/patients`,
      icon: ContactRound,
    },
    {
      title: "Samples",
      url: (orgId: string) => `/organizations/${orgId}/samples`,
      icon: Images,
    },
    {
      title: "Reports",
      url: (orgId: string) => `/organizations/${orgId}/reports`,
      icon: FileText,
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Organizations</SidebarGroupLabel>
      <SidebarMenu>
        {organizations.map((org) => {
          const isOpen = openStates[org.id] ?? true;

          return (
            <Collapsible 
              key={org.id} 
              defaultOpen={true}
              open={isOpen}
              onOpenChange={(open) => setOpenStates(prev => ({ ...prev, [org.id]: open }))}
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={org.name || "Unnamed Organization"}>
                    <Building className="size-4" style={{ color: org.color }} />
                    <span className="flex-1 text-left truncate">{org.name || "Unnamed Organization"}</span>
                    {isOpen ? (
                      <ChevronDown className="size-4 transition-transform" />
                    ) : (
                      <ChevronRight className="size-4 transition-transform" />
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {menuItems.map((item) => {
                      const url = item.url(org.id);
                      const isActive = pathname === url || pathname?.startsWith(url + "/");
                      return (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild isActive={isActive}>
                            <Link href={url}>
                              <item.icon />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}