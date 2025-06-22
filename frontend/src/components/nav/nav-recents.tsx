"use client";

import {
  FileImage,
  MoreHorizontal,
  ScanEye,
  Share,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";

export function NavRecents({ recentSamples }: { recentSamples: any[] }) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Recent</SidebarGroupLabel>
      <SidebarMenu>
        {recentSamples.map((recentSample) => (
          <SidebarMenuItem key={recentSample.id}>
            <SidebarMenuButton
              className="cursor-pointer"
              asChild
              onClick={() => router.push(`/samples/${recentSample.id}`)}
            >
              <div>
                <FileImage />
                <span>{recentSample.sampleName}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => router.push("/samples")}
            className="cursor-pointer"
          >
            <MoreHorizontal />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
