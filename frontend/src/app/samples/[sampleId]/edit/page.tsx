import Base from "@/components/base";
import SampleArea from "@/components/sample-area";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import UserButton from "@/components/user-button";
import {
  getPatientById,
  getProfileByUserId,
  getRoleById,
  getSampleById,
} from "@/db/queries/select";
import { Clock } from "lucide-react";

export default async function EditSamplePage({
  params,
}: {
  params: Promise<{ sampleId: string }>;
}) {
  const sampleId = (await params).sampleId;
  const sample = await getSampleById(sampleId);
  const patient = await getPatientById(sample.patientId);
  const profile = await getProfileByUserId(sample.uploadedBy);
  const role = await getRoleById(profile.roleId);

  return (
    <Base>
      <div className="flex h-full flex-1 gap-4 p-4">
        <Card
          key={sample.id}
          className="h-full min-w-40 gap-0 overflow-hidden p-0"
        >
          <CardFooter className="flex w-full flex-1 flex-col gap-2 overflow-hidden p-4">
            <div className="flex w-full justify-center gap-2 overflow-hidden">
              <UserButton
                imageUrl={patient.imageUrl || ""}
                firstName={patient.firstName}
                lastName={patient.lastName}
                redirectUrl={`/patients/${patient.id}`}
                roleName={role.name}
              />
              <UserButton
                imageUrl={profile.imageUrl || ""}
                firstName={profile.firstName}
                lastName={profile.lastName}
                redirectUrl={`/users/${profile.id}`}
                roleName={role.name}
              />
            </div>

            <div className="border-muted-foreground/20 flex w-full gap-1 rounded-md border p-1.5">
              {Object.entries(
                (sample.metadata as Record<string, unknown>) || {},
              ).map(([key, value]) => (
                <Card
                  key={key}
                  className="m-0 flex flex-1 justify-center gap-0 border-none p-0 shadow-none"
                >
                  <CardHeader className="m-0 flex flex-row items-center justify-center gap-0 p-0">
                    <CardTitle className="text-muted-foreground text-center text-[9px]">
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .trim()
                        .toUpperCase()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="m-0 gap-0 p-0">
                    <p className="truncate text-center text-xs font-medium">
                      {String(value)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-muted-foreground border-muted-foreground/20 bg-background top-2 right-2 flex w-full items-center justify-center gap-2 rounded-md border p-1.5 text-sm">
              <Clock className="h-3 w-3" />
              {sample.capturedAt ? sample.capturedAt.toLocaleString() : "N/A"}
            </div>
          </CardFooter>
        </Card>

        <SampleArea sample={sample} />
      </div>
    </Base>
  );
}
