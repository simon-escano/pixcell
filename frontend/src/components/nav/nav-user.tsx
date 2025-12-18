"use client";

import {
  Ellipsis,
  LogOut,
  UserIcon
} from "lucide-react";

import { logoutAction } from "@/actions/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Profile } from "@/db/schema";
import { User } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Badge } from "../ui/badge";

export function NavUser({
  user,
  profile,
  role,
}: {
  user: User;
  profile: Profile | null;
  role: string | null;
}) {
  const { isMobile } = useSidebar();

  const router = useRouter();
  const params = useParams();
  const orgId = (params as any)?.organizationId || "";
  const handleLogout = async () => {
    const toastId = toast.loading("Logging out...");
    await logoutAction();
    router.replace("/login");
    toast.dismiss(toastId);
  };

  const handleProfile = async () => {
    router.push(`/organizations/${orgId}/members/${user.id}`)
  };

  // Default values if profile is null
  const firstName = profile?.firstName || "";
  const lastName = profile?.lastName || "";
  const imageUrl = profile?.imageUrl || "";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="shadow-lg items-start flex-col flex gap-2 bg-card rounded-md border gap-2 h-auto data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <div className="flex items-center gap-2 w-full">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage
                    src={imageUrl}
                    alt={`${firstName} ${lastName}`}
                  />
                  <AvatarFallback className="rounded-full">
                    {firstName.charAt(0)}
                    {lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-xs leading-tight">
                  <span className="mr-2 min-w-0 flex-1 items-center truncate font-normal">
                    {firstName} {lastName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
                <Ellipsis className="ml-auto size-4 text-sidebar-icon" />
              </div>
              {role && (
                <Badge variant="outline" className="border-dashed flex justify-start rounded-sm flex-shrink-0 px-1.5 py-0.5 text-[10px] max-w-full">
                  <p className="truncate"><span className="text-muted-foreground mr-1.5">Role</span>{role}</p>
                </Badge>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={imageUrl}
                    alt={`${firstName} ${lastName}`}
                  />
                  <AvatarFallback className="rounded-lg">
                    {firstName.charAt(0)}
                    {lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="justiy-center flex w-full items-end overflow-hidden">
                    <span className="mr-2 min-w-0 items-center truncate font-normal">
                      {firstName} {lastName}
                    </span>
                    {role && (
                      <Badge className="mt-1 flex-shrink-0 px-1 py-0.5 text-[10px]">
                        {role}
                      </Badge>
                    )}
                  </div>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleProfile}>
                <UserIcon className="text-sidebar-icon" />
                Profile
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="text-sidebar-icon" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
