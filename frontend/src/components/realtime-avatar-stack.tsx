"use client";

import { AvatarStack } from "@/components/avatar-stack";

export const RealtimeAvatarStack = ({
  roomName,
  currentUserFullName,
}: {
  roomName?: string;
  currentUserFullName?: string;
}) => {
  return (
    <AvatarStack
      className="items-center"
      currentUserFullName={currentUserFullName}
      avatars={[]}
    />
  );
};
