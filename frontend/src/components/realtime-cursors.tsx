"use client";

import { Cursor } from "@/components/cursor";
import { useRealtimeCursors } from "@/hooks/use-realtime-cursors";

const THROTTLE_MS = 50;

import { useEffect, useRef, useState } from "react";

type CursorData = {
  position: { x: number; y: number };
  color: string;
  user: { name: string };
};

export const RealtimeCursors = ({
  roomName,
  username,
}: {
  roomName: string;
  username: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { cursors: rawCursors } = useRealtimeCursors({
    roomName,
    username,
    throttleMs: THROTTLE_MS,
  });

  const [relativeCursors, setRelativeCursors] = useState<
    Record<string, CursorData>
  >({});

  useEffect(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    const adjusted: Record<string, CursorData> = Object.fromEntries(
      Object.entries(rawCursors).map(([id, cursor]) => {
        return [
          id,
          {
            ...cursor,
            position: {
              x: cursor.position.x - rect.left,
              y: cursor.position.y - rect.top,
            },
          },
        ];
      }),
    );

    setRelativeCursors(adjusted);
  }, [rawCursors]);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      {Object.keys(relativeCursors).map((id) => (
        <Cursor
          key={id}
          className="absolute z-50 transition-transform ease-in-out"
          style={{
            transitionDuration: "20ms",
            top: 0,
            left: 0,
            transform: `translate(${relativeCursors[id].position.x}px, ${relativeCursors[id].position.y}px)`,
          }}
          color={relativeCursors[id].color}
          name={relativeCursors[id].user.name}
        />
      ))}
    </div>
  );
};
