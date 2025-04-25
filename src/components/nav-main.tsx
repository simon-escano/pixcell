import { ContactRound, FileText, House, Images, Info } from "lucide-react";

import { Collapsible } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import UploadSampleWrapper from "./upload-sample-wrapper";

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
      <SidebarMenuItem className="flex items-center gap-2">
        <UploadSampleWrapper />
        <HoverCard>
          <HoverCardTrigger className="h-full">
            <div className="cn-div aspect-square h-full">
              <Info />
              <span className="sr-only">Help</span>
            </div>
          </HoverCardTrigger>
          <HoverCardContent>
            Click the button to upload a sample image for collaboration and
            analysis; ensure it's in JPEG, PNG, or GIF format and under 5MB.
          </HoverCardContent>
        </HoverCard>
      </SidebarMenuItem>
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
