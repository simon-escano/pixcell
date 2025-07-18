import { ContactRound, FileText, House, Images, Info } from "lucide-react";

import { Collapsible } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import UploadSampleWrapper from "../samples/upload-sample-wrapper";

export function NavMain() {
  const items = [
    {
      title: "Home",
      url: "/",
      icon: House,
    },
    {
      title: "Patients",
      url: "/patients",
      icon: ContactRound,
      isActive: true,
    },
    {
      title: "Samples",
      url: "/samples",
      icon: Images,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: FileText,
    },
  ];
  return (
    <SidebarGroup>
      {/* Upload Sample and Camera buttons at the top, separated from dashboard links */}
      <div className="flex flex-col gap-2 mb-2">
        <UploadSampleWrapper />
      </div>
      <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.title}>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
