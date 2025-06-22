"use client"

import { useOthers, useOthersMapped } from "@liveblocks/react/suspense";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { userIdToColor } from "@/utils";

export default function Avatars() {
  const profiles = useOthersMapped(other => other.presence.profile).map(([, profile]) => profile);
  const users = useOthers();
  console.log(users);
  const shownAvatars = profiles.slice(0, 3);
  const hiddenAvatars = profiles.slice(3);

  return (
    <div
      className="-space-x-4 flex flex-row"
    >
      {shownAvatars.map(({userId, firstName, lastName, imageUrl}, index) => (
        <Tooltip key={`${firstName + " " + lastName}-${imageUrl}-${index}`}>
          <TooltipTrigger asChild>
            <Avatar className="hover:z-10" style={{
                borderColor: userIdToColor(userId),
                borderWidth: 3
              }}>
              <AvatarImage src={imageUrl || ""} />
              <AvatarFallback>
                {firstName + " " + lastName}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent color={userIdToColor(userId)} side="right">
            <p>
              {`${firstName} ${lastName}`}
            </p>
          </TooltipContent>
        </Tooltip>
      ))}

      {hiddenAvatars.length ? (
        <Tooltip key="hidden-avatars">
          <TooltipTrigger asChild>
            <Avatar>
              <AvatarFallback>
                +{profiles.length - shownAvatars.length}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="right">
            {hiddenAvatars.map(({ firstName, lastName }, index) => (
              <p key={`${firstName + " " + lastName}-${index}`}>{`${firstName} ${lastName}`}</p>
            ))}
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}