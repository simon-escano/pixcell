"use client";

import { Spinner } from "@/components/ui/spinner";

import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { ClientSideSuspense } from "@liveblocks/react";
import { RoomProvider } from "@liveblocks/react/suspense";

import { Sample } from "@/db/schema";
import SampleArea from "./sample-area";

type Props = {
  roomName: string;
  username: string;
  sample: Sample;
  disabled?: boolean;
};

export default function SampleAreaRoom({
  roomName,
  username,
  sample,
  disabled,
}: Props) {
  return (
    <RoomProvider
      id={roomName}
      initialPresence={{
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
      <div className="text-foreground-500 shadow-popup flex h-full w-full flex-1 flex-col overflow-hidden rounded-lg shadow-sm">
        <ClientSideSuspense fallback={<Loading />}>
          <SampleArea
            roomName={roomName}
            username={username}
            sample={sample}
            disabled={disabled}
          />
        </ClientSideSuspense>
      </div>
    </RoomProvider>
  );
}

function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Spinner className="">Loading...</Spinner>
    </div>
  );
}
