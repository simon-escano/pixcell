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

  // Convert params to the expected Promise format
  const sidebarParams = params?.organizationId 
    ? Promise.resolve({ organizationId: params.organizationId })
    : undefined;

  return (
    <SidebarProvider className="h-screen overflow-hidden">
      <AppSidebar params={sidebarParams} />
      <SidebarInset className="flex flex-col overflow-hidden">
        <Header organizations={organizations.map(org => ({
          id: org.id,
          name: org.name,
          imageUrl: org.imageUrl,
        }))} />
        <div className="flex-1 overflow-y-auto [&_a:not([class*='bg-']):hover]:bg-inset-hover [&_a:not([class*='bg-']):active]:bg-inset-active [&_button:not([class*='bg-']):not([class*='Button']):hover]:bg-inset-hover [&_button:not([class*='bg-']):not([class*='Button']):active]:bg-inset-active">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Base;
