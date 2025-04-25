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
  small,
}: {
  imageUrl: string;
  firstName: string;
  lastName: string;
  redirectUrl?: string;
  small?: boolean;
}) => {
  const router = useRouter();

  return (
    <Button
      className={`bg-sidebar-accent text-sidebar-accent-foreground hover:bg-primary/5 flex h-min flex-1 ${small ? "w-full px-1 py-1" : "cursor-pointer px-3 py-2"}`}
      onClick={() => {
        if (redirectUrl) {
          router.push(redirectUrl);
        }
      }}
    >
      <Avatar className="rounded-lg">
        <AvatarImage
          src={imageUrl || ""}
          alt={firstName + lastName}
          className={`flex items-center justify-center${small ? "h-full w-full rounded-md" : ""}`}
        />
        <AvatarFallback className="rounded-lg">
          {firstName.charAt(0)}
          {lastName.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex w-full flex-1 flex-col text-left text-sm leading-tight">
        <div className="justiy-center flex w-full flex-1 items-end overflow-hidden">
          <span className="mr-2 flex w-full min-w-0 flex-1 items-center truncate font-semibold">
            {firstName} {lastName}
          </span>
        </div>
        <span className="text-muted-foreground truncate text-xs">user</span>
      </div>
    </Button>
  );
};

export default UserButton;
