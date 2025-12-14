import React from "react";
import { SidebarInset, SidebarProvider } from "./ui/sidebar";
import { AppSidebar } from "./nav/app-sidebar";
import Header from "./header";
import { getUser } from "@/lib/auth";
import { getProfileByUserId, getOrganizationsByProfileId } from "@/db/queries/select";

type BaseProps = Readonly<{
  children: React.ReactNode;
  params?: { organizationId?: string } | null;
}>;

const Base = async ({ children, params }: BaseProps) => {
  const user = await getUser();
  const profileData = await getProfileByUserId(user.id);
  const organizations = await getOrganizationsByProfileId(profileData?.id || "");

  return (
    <SidebarProvider className="h-screen overflow-hidden">
      <AppSidebar params={params} />
      <SidebarInset className="flex flex-col overflow-hidden">
        <Header organizations={organizations.map(org => ({
          id: org.id,
          name: org.name,
          color: org.color,
        }))} />
        <div className="-mt-4 flex-1 overflow-y-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Base;
