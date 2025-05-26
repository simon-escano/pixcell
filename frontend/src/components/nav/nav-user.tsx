"use client";

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  UserIcon,
} from "lucide-react";

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
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { logoutAction } from "@/actions/users";
import { Badge } from "../ui/badge";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/db/schema";

export function NavUser({
  user,
  profile,
  role,
}: {
  user: User;
  profile: Profile;
  role: any;
}) {
  const { isMobile } = useSidebar();

  const router = useRouter();
  const handleLogout = async () => {
    const toastId = toast.loading("Logging out...");
    await logoutAction();
    router.replace("/login");
    toast.dismiss(toastId);
  };

  const handleProfile = async () => {
    router.push(`/users/${user.id}`);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={profile.imageUrl || ""}
                  alt={profile.firstName + profile.lastName}
                />
                <AvatarFallback className="rounded-lg">
                  {profile.firstName.charAt(0)}
                  {profile.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="justiy-center flex items-end overflow-hidden">
                  <span className="mr-2 min-w-0 flex-1 items-center truncate font-semibold">
                    {profile.firstName} {profile.lastName}
                  </span>
                  <Badge className="mt-1 flex-shrink-0 px-1 py-0.5 text-[10px]">
                    {role}
                  </Badge>
                </div>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
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
                    src={profile.imageUrl || ""}
                    alt={profile.firstName + profile.lastName}
                  />
                  <AvatarFallback className="rounded-lg">
                    {profile.firstName.charAt(0)}
                    {profile.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="justiy-center flex w-full items-end overflow-hidden">
                    <span className="mr-2 min-w-0 items-center truncate font-semibold">
                      {profile.firstName} {profile.lastName}
                    </span>
                    <Badge className="mt-1 flex-shrink-0 px-1 py-0.5 text-[10px]">
                      {role}
                    </Badge>
                  </div>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleProfile}>
                <UserIcon />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
