import { cn } from "@/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const avatarStackVariants = cva("flex -space-x-4 -space-y-4", {
  variants: {
    orientation: {
      vertical: "flex-row",
      horizontal: "flex-col",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

export interface AvatarStackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarStackVariants> {
  avatars: { name: string; image: string }[];
  currentUserFullName?: string;
  maxAvatarsAmount?: number;
}

const AvatarStack = ({
  className,
  orientation,
  avatars,
  currentUserFullName,
  maxAvatarsAmount = 3,
  ...props
}: AvatarStackProps) => {
  const shownAvatars = avatars.slice(0, maxAvatarsAmount);
  const hiddenAvatars = avatars.slice(maxAvatarsAmount);

  return (
    <div
      className={cn(
        avatarStackVariants({ orientation }),
        className,
        orientation === "horizontal" ? "-space-x-0" : "-space-y-0",
      )}
      {...props}
    >
      {shownAvatars.map(({ name, image }, index) => (
        <Tooltip key={`${name}-${image}-${index}`}>
          <TooltipTrigger asChild>
            <Avatar className="hover:z-10">
              <AvatarImage src={image} />
              <AvatarFallback>
                {name
                  ?.split(" ")
                  ?.map((word) => word[0])
                  ?.join("")
                  ?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>
              {currentUserFullName && name === currentUserFullName
                ? "You"
                : name}
            </p>
          </TooltipContent>
        </Tooltip>
      ))}

      {hiddenAvatars.length ? (
        <Tooltip key="hidden-avatars">
          <TooltipTrigger asChild>
            <Avatar>
              <AvatarFallback>
                +{avatars.length - shownAvatars.length}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="right">
            {hiddenAvatars.map(({ name }, index) => (
              <p key={`${name}-${index}`}>{name}</p>
            ))}
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
};

export { AvatarStack, avatarStackVariants };
