"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLastSelectedOrganizationId, setLastSelectedOrganizationId } from "@/lib/organization-storage";
import { LoadingScreen } from "@/components/loading-screen";

interface OrganizationsRedirectClientProps {
  organizations: { id: string }[];
}

export default function OrganizationsRedirectClient({ organizations }: OrganizationsRedirectClientProps) {
  const router = useRouter();

  useEffect(() => {
    // Check localStorage for last selected organization
    const lastOrgId = getLastSelectedOrganizationId();
    
    // If last org exists and user is still part of it, redirect there
    if (lastOrgId && organizations.some(org => org.id === lastOrgId)) {
      router.replace(`/organizations/${lastOrgId}`);
      return;
    }

    // Otherwise, redirect to first organization
    if (organizations.length > 0) {
      const firstOrgId = organizations[0].id;
      setLastSelectedOrganizationId(firstOrgId);
      router.replace(`/organizations/${firstOrgId}`);
    }
  }, [organizations, router]);

  // Show loading state while redirecting - using the same component as loading.tsx
  // Note: We can't use Base here as it's a server component, but LoadingScreen works fine standalone
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <LoadingScreen />
    </div>
  );
}

