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
import { ContactRound, FileText, Images, UsersRound, ChevronRight, ChevronDown } from "lucide-react";
import { OrganizationAvatar } from "@/components/organization-avatar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { setLastSelectedOrganizationId } from "@/lib/organization-storage";

interface Organization {
  id: string;
  name: string | null;
  imageUrl: string | null;
}

interface NavMainProps {
  organizations: Organization[];
}

export function NavMain({ organizations }: NavMainProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openStates, setOpenStates] = React.useState<Record<string, boolean>>(() => {
    if (!organizations || organizations.length === 0) {
      return {};
    }
    return organizations.reduce((acc, org) => {
      acc[org.id] = true; // All open by default
      return acc;
    }, {} as Record<string, boolean>);
  });

  // Update openStates when organizations change
  React.useEffect(() => {
    if (organizations && organizations.length > 0) {
      setOpenStates((prev) => {
        const newStates = { ...prev };
        organizations.forEach((org) => {
          if (!(org.id in newStates)) {
            newStates[org.id] = true;
          }
        });
        return newStates;
      });
    }
  }, [organizations]);

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
    {
      title: "Members",
      url: (orgId: string) => `/organizations/${orgId}/members`,
      icon: UsersRound,
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Organizations</SidebarGroupLabel>
      <SidebarMenu className="gap-px">
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
                <div className="flex items-center w-full">
                  <Link 
                    href={`/organizations/${org.id}`}
                    className="flex items-center gap-2 flex-1 min-w-0 p-2 rounded-md hover:bg-sidebar-accent transition-colors text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLastSelectedOrganizationId(org.id);
                    }}
                  >
                    <OrganizationAvatar imageUrl={org.imageUrl} name={org.name} />
                    <span className="flex-1 text-left truncate font-normal">{org.name || "Unnamed Organization"}</span>
                  </Link>
                  <CollapsibleTrigger asChild>
                    <button
                      className="flex-shrink-0 p-1.5 mx-1 rounded-md hover:bg-sidebar-accent transition-colors"
                      aria-label={isOpen ? "Collapse" : "Expand"}
                    >
                      {isOpen ? (
                        <ChevronDown className="size-4 transition-transform text-sidebar-icon" />
                      ) : (
                        <ChevronRight className="size-4 transition-transform text-sidebar-icon" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                </div>
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