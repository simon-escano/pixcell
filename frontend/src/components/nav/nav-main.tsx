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
import { ReactNode } from "react";
import UploadSampleWrapper from "@/components/samples/upload-sample-wrapper";

interface NavMainProps {
  organizationId?: string;
  patientsRaw?: any[];
}

export async function NavMain({ organizationId, patientsRaw }: NavMainProps) {
  // If no valid ID is found, hide the menu
  if (!organizationId || typeof organizationId !== "string" || organizationId.trim() === "") {
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
      {organizationId && (
        <div className="flex flex-col gap-2 mb-2">
          {/* Server-rendered upload button/wrapper for the current organization */}
          <UploadSampleWrapper organizationId={organizationId} patientsRaw={patientsRaw || []} />
        </div>
      )}

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