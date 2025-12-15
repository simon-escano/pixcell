"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React from "react";
import { Button } from "../ui/button";
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
      className="gap-2 pl-1.5 pr-2"
      variant="ghost"
      onClick={handleClick}
    >
      <Avatar className="size-[18px] rounded-none">
        <AvatarImage
          src={imageUrl || ""}
          alt={firstName + lastName}
          className="flex h-full w-full items-center justify-center rounded-full"
        />
        <AvatarFallback className="rounded-lg">
          {firstName.charAt(0)}
          {lastName.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <p className="w-full truncate text-xs">
        {firstName} {lastName}
      </p>
    </Button>
  );
};

export default UserButton;
