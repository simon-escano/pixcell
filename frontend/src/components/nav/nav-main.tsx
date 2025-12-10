"use client"

import { ContactRound, FileText, Images, LayoutDashboard } from "lucide-react";
import { Collapsible } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
// REMOVE THIS IMPORT: import UploadSampleWrapper from "../samples/upload-sample-wrapper";
import Link from "next/link";
import { useParams } from "next/navigation";
import UploadSampleWrapper from "../samples/upload-sample-wrapper";

interface NavMainProps {
  organizationId?: string;
  children?: React.ReactNode; // Add this prop to accept the button
}

export function NavMain({ organizationId: propOrgId, children }: NavMainProps) {
  const params = useParams();
  
  // Logic: Use prop if available, otherwise read from URL, otherwise undefined
  const organizationId = propOrgId || (params?.organizationId as string);

  // If no ID is found in props OR URL, hide the menu
  if (!organizationId) {
    return null;
  }

  const items = [
    {
      title: "Dashboard",
      url: `/organizations/${organizationId}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      title: "Patients",
      url: `/organizations/${organizationId}/patients`,
      icon: ContactRound,
      isActive: true, 
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
      {/* Render the passed Server Component here */}
      <div className="flex flex-col gap-2 mb-2">
        {children}
      </div>
      
      <UploadSampleWrapper organizationId={organizationId} />
      
      <SidebarGroupLabel>Organization</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}