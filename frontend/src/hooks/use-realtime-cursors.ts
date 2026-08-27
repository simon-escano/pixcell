import { useState, useEffect } from "react";

export type RealtimeCursor = {
  position: { x: number; y: number };
  color: string;
  user: { name: string };
};

export function useRealtimeCursors({
  roomName,
  username,
  throttleMs = 50,
}: {
  roomName: string;
  username: string;
  throttleMs?: number;
}) {
  const [cursors, setCursors] = useState<Record<string, RealtimeCursor>>({});

  return { cursors };
}
