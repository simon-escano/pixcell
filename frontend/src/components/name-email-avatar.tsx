"use client";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface NameEmailAvatarProps {
  imageUrl?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  onClick?: () => void;
}

const NameEmailAvatar = ({ imageUrl, firstName, lastName, email, onClick }: NameEmailAvatarProps) => {
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  
  return (
    <div 
      className={`flex items-center gap-2.5 ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <Avatar className="size-6 flex-shrink-0">
        <AvatarImage src={imageUrl || ""} alt={`${firstName} ${lastName}`} />
        <AvatarFallback className="text-xs">
          {initials || "?"}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0 gap-0">
        <span className="text-xs truncate">
          {firstName} {lastName}
        </span>
        {email && (
          <span className="text-xs text-muted-foreground truncate">
            {email}
          </span>
        )}
      </div>
    </div>
  );
};

export default NameEmailAvatar;

