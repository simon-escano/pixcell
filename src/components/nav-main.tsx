import {
  ChevronRight,
  ContactRound,
  FileText,
  House,
  Images,
  ImageUp,
  Info,
  MailIcon,
  PlusCircleIcon,
  type LucideIcon,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
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
        <Button
          size="icon"
          className="h-9 w-9 shrink-0 group-data-[collapsible=icon]:opacity-0"
          variant="outline"
        >
          <Info />
          <span className="sr-only">Help</span>
        </Button>
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
