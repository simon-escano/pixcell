"use client";

import { LiveblocksProvider } from "@liveblocks/react";
import { ReactNode } from "react";

export default function LiveblocksWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth" throttle={16}>
      {children}
    </LiveblocksProvider>
  );
}
