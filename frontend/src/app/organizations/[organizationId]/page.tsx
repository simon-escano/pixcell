import Base from '@/components/base';
import { getOrganizationById } from '@/db/queries/select';
import React from 'react'

const OrganizationPage = async ({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) => {
    const organizationId = (await params).organizationId;
    const organization = await getOrganizationById(organizationId);

    return (
        <Base>
            <div className="h-full overflow-y-auto p-4 sm:p-8">
                <h1 className='text-2xl font-semibold mb-4'>{organization?.name || "Unnamed Organization"}</h1>
                <p className='text-sm text-muted-foreground'>Address: {organization?.address || "No address provided"}</p>
            </div>
        </Base>
    )
}

export default OrganizationPage