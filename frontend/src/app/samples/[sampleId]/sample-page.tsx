import Base from "@/components/base";
import { RealtimeAvatarStack } from "@/components/realtime-avatar-stack";
import { ShareDialog } from "@/components/share-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { getUser } from "@/lib/auth";
import { LiveblocksProvider } from "@liveblocks/react";
import { BrainCircuit, Clock } from "lucide-react";
import Room from "./room";
import LiveblocksWrapper from "@/components/liveblocks-wrapper";

interface SamplePageProps {
  sampleId: string;
  disabled?: boolean;
}

export async function SamplePage({
  sampleId,
  disabled = false,
}: SamplePageProps) {
  const user = await getUser();
  const userProfile = await getProfileByUserId(user.id);
  const sample = await getSampleById(sampleId);
  const patient = await getPatientById(sample.patientId);
  const profile = await getProfileByUserId(sample.uploadedBy);
  const role = await getRoleById(profile.roleId);

  return (
    <LiveblocksWrapper>
      <Base>
        <div className="flex h-full flex-1 gap-4 p-4 sm:p-8">
          <Room roomName={`sample_${sample.id}`}></Room>
          <div className="flex h-full min-w-40 flex-col gap-3 overflow-hidden">
            <div className="flex flex-row justify-between gap-2">
              <RealtimeAvatarStack
                roomName={sampleId}
                currentUserFullName={
                  userProfile.firstName + " " + userProfile.lastName
                }
              ></RealtimeAvatarStack>
              <ShareDialog />
            </div>
            <Card className="flex flex-col gap-2 p-3">
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
            </Card>
            <Card className="flex w-full flex-1 flex-col gap-2 overflow-hidden p-4">
              <CardTitle>AI Analysis</CardTitle>
              <CardDescription>Powered by DeepSeek</CardDescription>
              <CardContent className="flex flex-1 items-center justify-center">
                <p className="text-muted-foreground max-w-48 text-center">
                  Sample must have detections before analyzing
                </p>
              </CardContent>
              <CardFooter className="p-0">
                <Button className="w-full" disabled={true}>
                  <BrainCircuit />
                  Analyze
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </Base>
    </LiveblocksWrapper>
  );
}
