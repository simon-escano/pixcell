"use client";

import Avatars from '@/components/avatars';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import UserButton from '@/components/users/user-button';
import { Patient, Profile, Role, Sample } from '@/db/schema';
import { LiveList, LiveMap, LiveObject } from '@liveblocks/client';
import { ClientSideSuspense, RoomProvider } from '@liveblocks/react';
import { BrainCircuit, Clock } from 'lucide-react';
import { ShareDialog } from '../share-dialog';
import SampleArea from './sample-area';

export function SamplePage({roomName, patient, profile, role, sample, disabled}: {roomName: string, patient: Patient, profile: Profile, role: Role, sample: Sample, disabled?: boolean}) {
  return (
    <RoomProvider
      id={roomName}
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
    </RoomProvider>
  )
}