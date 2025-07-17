"use client";

import { RealtimeAvatarStack } from "@/components/realtime-avatar-stack";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock } from "lucide-react";
import { PatientWithImage, ProfileWithImage, SampleWithImage } from "@/db/schema";
import { ClientSideSuspense, RoomProvider } from "@liveblocks/react";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { Spinner } from "@/components/ui/spinner";
import SampleArea from "./sample-area";
import Avatars from "@/components/avatars";
import { ShareDialog } from "../share-dialog";
import UserButton from "@/components/users/user-button";
import ClientDate from "@/components/client-date";

interface SamplePageProps {
  roomName?: string;
  sample: SampleWithImage;
  patient: PatientWithImage;
  profile: ProfileWithImage;
  roleName: string | null;
  disabled?: boolean;
}

export function SamplePage({
  roomName,
  sample,
  patient,
  profile,
  roleName,
  disabled = false,
}: SamplePageProps) {
  return (
    <RoomProvider
      id={roomName || `sample_${sample.id}`}
      initialPresence={{
        profile: profile,
        selection: [],
        cursor: null,
        pencilDraft: null,
        penColor: null,
      }}
      initialStorage={{
        layers: new LiveMap<string, LiveObject<any>>(),
        layerIds: new LiveList([]),
      }}
      >
      <div className="flex h-full flex-1 gap-4 p-4 sm:p-8">
        <ClientSideSuspense fallback={<Spinner />}>
          <SampleArea
            sample={sample}
            disabled={disabled}
          />
        </ClientSideSuspense>
        <div className="flex h-full min-w-40 flex-col gap-3 overflow-hidden">
          <div className="flex flex-row justify-between gap-2">
            <ClientSideSuspense fallback={<Spinner />}>
              <Avatars />
            </ClientSideSuspense>
            <ShareDialog />
          </div>
          <Card className="flex flex-col gap-2 p-3">
            <div className="flex w-full justify-center gap-2 overflow-hidden">
              <UserButton
                imageUrl={patient.imageUrl || ""}
                firstName={patient.firstName}
                lastName={patient.lastName}
                redirectUrl={`/patients/${patient.id}`}
                roleName={roleName || "Unknown"}
              />
              {profile && (
                <UserButton
                  imageUrl={profile.imageUrl || ""}
                  firstName={profile.firstName}
                  lastName={profile.lastName}
                  redirectUrl={`/users/${profile.userId}`}
                  roleName={roleName || "Unknown"}
                />
              )}
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
              {sample.capturedAt ? <ClientDate date={sample.capturedAt} /> : "N/A"}
            </div>
          </Card>
        </div>
      </div>
    </RoomProvider>
  )
}