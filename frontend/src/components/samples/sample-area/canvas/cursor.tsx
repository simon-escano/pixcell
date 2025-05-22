import { useOther } from "@liveblocks/react/suspense";
import { memo, useEffect } from "react";
import { connectionIdToColor, userIdToColor } from "@/utils";

type Props = {
  connectionId: number;
  name: string;
};

function Cursor({ connectionId, name }: Props) {
  //
  // RATIONALE:
  // Each cursor itself subscribes to _just_ the change for the user. This
  // means that if only one user's cursor is moving, only one <Cursor />
  // component has to re-render. All the others can remain idle.
  //
  const user = useOther(connectionId, (u) => u);

  const cursor = user?.presence?.cursor;
  if (!cursor) {
    return null;
  }

  const { x, y } = cursor;
  return (
    <path
      style={{
        transform: `translateX(${x}px) translateY(${y}px) scale(1.25)`,
      }}
      d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"
      fill={userIdToColor(user.presence.profile.userId)}
    />
  );
}

export default memo(Cursor);
