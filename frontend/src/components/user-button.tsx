"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

const UserButton = ({
  imageUrl,
  firstName,
  lastName,
  redirectUrl,
  roleName,
  onClick,
}: {
  imageUrl: string;
  firstName: string;
  lastName: string;
  redirectUrl?: string;
  small?: boolean;
  roleName?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) => {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Stop the event from bubbling up

    if (onClick) {
      // If a custom onClick handler is provided, use it
      onClick(e);
    } else if (redirectUrl) {
      // Otherwise use the redirectUrl if provided
      router.push(redirectUrl);
    }
  };

  return (
    <Button
      className="bg-sidebar-accent text-sidebar-accent-foreground hover:bg-primary/5 flex h-min w-full flex-1 overflow-hidden p-1.5 pr-2"
      onClick={handleClick}
    >
      <Avatar className="size-6 rounded-none">
        <AvatarImage
          src={imageUrl || ""}
          alt={firstName + lastName}
          className="flex h-full w-full items-center justify-center rounded-sm"
        />
        <AvatarFallback className="rounded-lg">
          {firstName.charAt(0)}
          {lastName.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex w-full flex-1 flex-col truncate overflow-hidden text-left leading-tight">
        <p className="mr-2 w-full truncate overflow-hidden text-[11px] font-semibold text-ellipsis whitespace-nowrap">
          {firstName} {lastName}
        </p>
        <p className="text-muted-foreground w-full truncate overflow-hidden text-[9px] text-ellipsis whitespace-nowrap">
          {roleName ? roleName : "Patient"}
        </p>
      </div>
    </Button>
  );
};

export default UserButton;
