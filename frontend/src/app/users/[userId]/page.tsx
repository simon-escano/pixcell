import Base from "@/components/base";
import SampleWrapper from "@/components/sample-wrapper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  getProfileByUserId,
  getReportsByGeneratedBy,
  getRoleById,
  getSamplesByUserId,
  getUserById,
} from "@/db/queries/select";
import { Mail, Phone } from "lucide-react";

export default async function UserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const userId = (await params).userId;
  const user = await getUserById(userId);
  const profile = await getProfileByUserId(userId);
  const samples = await getSamplesByUserId(userId);
  const reports = await getReportsByGeneratedBy(userId);
  const role = (await getRoleById(profile.roleId)).name;

  return (
    <Base>
      <div className="grid gap-4 p-4 sm:p-8 xl:grid-cols-4">
        <div className="space-y-4 xl:col-span-1">
          <Card className="bg-card text-card-foreground relative flex flex-col gap-6 rounded-xl border py-6 shadow-none">
            <CardContent className="px-6">
              <div className="space-y-12">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="size-20 rounded-full">
                    <AvatarImage
                      src={profile.imageUrl || ""}
                      alt={profile.firstName + profile.lastName}
                      className="object-cover"
                    />
                    <AvatarFallback>
                      {profile.firstName[0]}
                      {profile.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h5 className="text-xl font-semibold">
                      {profile.firstName} {profile.lastName}
                    </h5>
                    <div className="text-muted-foreground text-sm">{role}</div>
                  </div>
                </div>
                <div className="bg-muted grid grid-cols-2 divide-x rounded-md border text-center *:py-3">
                  {[
                    { label: "Samples", value: samples.length },
                    {
                      label: "Reports",
                      value: reports.length,
                    },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <h5 className="text-lg font-semibold">{value}</h5>
                      <div className="text-muted-foreground text-sm">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-muted-foreground flex flex-col gap-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="size-4" /> {user.email}
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="size-4" /> {user.phone}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4 xl:col-span-3">
          <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {samples.map(async (sample) => (
              <SampleWrapper key={sample.id} sample={sample} />
            ))}
          </div>
        </div>
      </div>
    </Base>
  );
}
