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
}: {
  imageUrl: string;
  firstName: string;
  lastName: string;
  redirectUrl?: string;
  small?: boolean;
  roleName?: string;
}) => {
  const router = useRouter();

  return (
    <Button
      className="bg-sidebar-accent text-sidebar-accent-foreground hover:bg-primary/5 flex h-min flex-1 overflow-hidden w-full p-1 pr-2"
      onClick={() => {
        if (redirectUrl) {
          router.push(redirectUrl);
        }
      }}
    >
      <Avatar className="rounded-none size-6">
        <AvatarImage
          src={imageUrl || ""} 
          alt={firstName + lastName}
          className="flex items-center justify-center h-full w-full rounded-sm"
        />
        <AvatarFallback className="rounded-lg">
          {firstName.charAt(0)}
          {lastName.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex w-full flex-1 flex-col text-left leading-tight overflow-hidden truncate">
        <p className="truncate whitespace-nowrap overflow-hidden text-ellipsis w-full font-semibold mr-2 text-[11px]">
          {firstName} {lastName}
        </p>
        <p className="truncate whitespace-nowrap overflow-hidden text-ellipsis text-muted-foreground text-[9px] w-full">
          {roleName}
        </p>
      </div>
    </Button>
  );
};

export default UserButton;
