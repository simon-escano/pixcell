import { PasswordChangeWrapper } from '@/components/auth/password-change-wrapper';
import Base from '@/components/base';
import { getOrganizationsByProfileId, getProfileByUserId } from '@/db/queries/select';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Building } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import OrganizationsRedirectClient from './organizations-redirect-client';

export const metadata = {
  title: "PixCell | Organizations",
};

const OrganizationsPage = async () => {
    const user = await getUser();
    const profileData = await getProfileByUserId(user.id);
    const organizations = await getOrganizationsByProfileId(profileData?.id || "");

    // If no organizations, show message
    if (organizations.length === 0) {
    return (
        <PasswordChangeWrapper mustChangePassword={profileData.mustChangePassword}>
            <Base>
                <div className="h-full overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10">
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Building className="size-12 text-muted-foreground mb-4" />
                                <p className="text-lg font-medium mb-2">No Organizations</p>
                                <p className="text-muted-foreground text-center max-w-md">
                                    You are not part of any organization. Please contact your administrator to add you to an organization.
                                </p>
                            </CardContent>
                        </Card>
                </div>
            </Base>
        </PasswordChangeWrapper>
        );
    }

    // If organizations exist, redirect to first one (client will handle localStorage check)
    return <OrganizationsRedirectClient organizations={organizations.map(org => ({ id: org.id }))} />;
}

export default OrganizationsPage