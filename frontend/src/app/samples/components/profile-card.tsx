"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { MetaPatient, MetaProfile } from "../types";

interface ProfileCardProps {
  profile: MetaProfile | MetaPatient;
  redirectUrl?: string;
}

const ProfileCard = ({ profile, redirectUrl }: ProfileCardProps) => {
  const router = useRouter();
  return (
    <div
      onClick={() => {
        if (redirectUrl) {
          router.push(redirectUrl);
        }
      }}
      className="bg-muted text-card-foreground flex items-center gap-1.5 overflow-hidden rounded-sm border px-1.5 py-1 text-xs"
    >
      <Avatar className="size-5">
        <AvatarImage src={profile.imageUrl!} />
        <AvatarFallback>
          <ImageOff className="text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col overflow-hidden">
        <span className="truncate">{profile.fullName}</span>
        <span className="text-muted-foreground truncate">{profile.role}</span>
      </div>
    </div>
  );
};

export default ProfileCard;
