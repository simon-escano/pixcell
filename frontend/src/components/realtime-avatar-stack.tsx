"use client";

import { AvatarStack } from "@/components/avatar-stack";
import { useRealtimePresenceRoom } from "@/hooks/use-realtime-presence-room";
import { useMemo } from "react";

export const RealtimeAvatarStack = ({
  roomName,
  currentUserFullName,
}: {
  roomName: string;
  currentUserFullName?: string;
}) => {
  const { users: usersMap } = useRealtimePresenceRoom(roomName);
  const avatars = useMemo(() => {
    return Object.values(usersMap).map((user) => ({
      name: user.name,
      image: user.image,
    }));
  }, [usersMap]);

  return (
    <AvatarStack
      className="items-center"
      currentUserFullName={currentUserFullName}
      avatars={avatars}
    />
  );
};
