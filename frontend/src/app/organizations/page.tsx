import { PasswordChangeWrapper } from '@/components/auth/password-change-wrapper';
import Base from '@/components/base';
import { getOrganizationsByProfileId, getProfileByUserId } from '@/db/queries/select';
import { getUser } from '@/lib/auth';
import Link from 'next/link';

export const metadata = {
  title: "PixCell | Organizations",
};

const OrganizationsPage = async () => {
    const user = await getUser();
    const profileData = await getProfileByUserId(user.id);
    const organizations = await getOrganizationsByProfileId(profileData?.id || "");

    return (
        <PasswordChangeWrapper mustChangePassword={profileData.mustChangePassword}>
            <Base>
                <div className="h-full overflow-y-auto p-4 sm:p-8">
                    <h1 className='text-2xl font-semibold mb-4'>Organizations</h1>
                    <div className='flex flex-col gap-4'>
                        {organizations.map((org) => (
                            <Link key={org.id} href={`/organizations/${org.id}`}>
                                <div className='p-4 border rounded-lg cursor-pointer hover:bg-accent'>
                                    <h2 className='text-lg font-medium'>{org.name || "Unnamed Organization"}</h2>
                                    <p className='text-sm text-muted-foreground'>Address: {org.address || "No address provided"}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </Base>
        </PasswordChangeWrapper>
    )
}

export default OrganizationsPage