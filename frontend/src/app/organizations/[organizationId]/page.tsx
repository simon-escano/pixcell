import Base from '@/components/base';
import { getOrganizationById } from '@/db/queries/select';
import React from 'react'
import { Metadata } from 'next';

function truncate(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}): Promise<Metadata> {
  const paramsObj = await params;
  const organization = await getOrganizationById(paramsObj.organizationId);
  const orgName = organization?.name 
    ? truncate(organization.name)
    : "Organization";
  
  return {
    title: `PixCell | ${orgName}`,
  };
}

const OrganizationPage = async ({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) => {
  const paramsObj = await params;
  const organizationId = paramsObj.organizationId;
  const organization = await getOrganizationById(organizationId);

  return (
    <Base params={paramsObj}>
      <div className="h-full overflow-y-auto p-4 sm:p-8">
        <h1 className="text-2xl font-semibold mb-4">{organization?.name || "Unnamed Organization"}</h1>
        <p className="text-sm text-muted-foreground">Address: {organization?.address || "No address provided"}</p>
      </div>
    </Base>
  );
};

export default OrganizationPage