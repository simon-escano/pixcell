import { PasswordChangeWrapper } from '@/components/auth/password-change-wrapper';
import Base from '@/components/base';
import { getOrganizationsByProfileId, getProfileByUserId } from '@/db/queries/select';
import { getUser } from '@/lib/auth';
import Link from 'next/link';
import { Building, MapPin, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

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
                <div className="h-full overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10">
                    <div className="mb-6 md:mb-8">
                        <h1 className='text-3xl font-semibold tracking-tight mb-2'>Organizations</h1>
                        <p className='text-muted-foreground'>Manage and access your organizations</p>
                    </div>
                    
                    {organizations.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Building className="size-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No organizations found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {organizations.map((org) => {
                                const orgColor = org.color || "#7E7E82";
                                return (
                                    <Link key={org.id} href={`/organizations/${org.id}`} className="group">
                                        <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between gap-2 mb-2 w-full overflow-hidden">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <Building 
                                                            className="size-5 shrink-0" 
                                                            style={{ color: orgColor }}
                                                        />
                                                        <CardTitle className="text-lg font-semibold truncate">
                                                            {org.name || "Unnamed Organization"}
                                                        </CardTitle>
                                                    </div>
                                                </div>
                                                {org.address && (
                                                    <CardDescription className="flex items-center gap-1.5 text-xs">
                                                        <MapPin className="size-3.5 shrink-0" />
                                                        <span className="line-clamp-2">{org.address}</span>
                                                    </CardDescription>
                                                )}
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="size-3.5" />
                                                        <span>
                                                            {org.createdAt 
                                                                ? format(new Date(org.createdAt), "MMM yyyy")
                                                                : "N/A"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Base>
        </PasswordChangeWrapper>
    )
}

export default OrganizationsPage