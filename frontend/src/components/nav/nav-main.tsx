import { Camera, ContactRound, FileText, House, Images, Info } from "lucide-react";

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
import { Button } from "../ui/button";
import Link from "next/link";

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
        <Link href="/camera"
          className="flex items-center gap-2 px-3 py-2 border-2 hover:bg-secondary/80 w-full justify-start rounded-lg shadow-sm"
        >
          <Camera className="text-primary size-4" />
          <span className="text-sm">Camera</span>
        </Link>
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
