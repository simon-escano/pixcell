"use client";

import { ClientSideSuspense, RoomProvider } from "@liveblocks/react/suspense";
import { ReactNode } from "react";
import { LiveMap } from "@liveblocks/core";
import { LiveblocksLoading } from "./components/Loading";
import { Providers } from "./Providers";

interface RoomProps {
  roomId: string;
  children: ReactNode;
}

export function Room({ roomId, children }: RoomProps) {
  return (
    <Providers>
      <RoomProvider
        id={roomId}
        initialPresence={{ presence: undefined }}
        initialStorage={{ records: new LiveMap() }}
      >
        <ClientSideSuspense fallback={<LiveblocksLoading />}>{children}</ClientSideSuspense>
      </RoomProvider>
    </Providers>
  );
}
