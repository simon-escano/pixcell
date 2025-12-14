"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { setLastSelectedOrganizationId } from "@/lib/organization-storage";

/**
 * Client component that saves the current organization ID to localStorage
 * when the user visits an organization page
 */
export function OrganizationPageWrapper({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const organizationId = params?.organizationId as string | undefined;

  useEffect(() => {
    if (organizationId) {
      setLastSelectedOrganizationId(organizationId);
    }
  }, [organizationId]);

  return <>{children}</>;
}

