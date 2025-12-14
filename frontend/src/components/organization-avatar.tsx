"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface OrganizationAvatarProps {
  imageUrl: string | null
  name: string | null
  className?: string
}

export function OrganizationAvatar({ imageUrl, name, className }: OrganizationAvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  // Default size is 16px (size-4), but allow override via className
  const defaultSize = "16px"
  const hasCustomSize = className && (className.includes("size-") || className.includes("w-") || className.includes("h-"))

  return (
    <Avatar 
      className={`${className || "size-4"} rounded-[2px]`}
      style={hasCustomSize ? { 
        borderRadius: "2px", 
        overflow: "hidden"
      } : { 
        borderRadius: "2px", 
        width: defaultSize, 
        height: defaultSize,
        minWidth: defaultSize,
        minHeight: defaultSize,
        overflow: "hidden"
      }}
    >
      <AvatarImage 
        src={imageUrl || ""} 
        alt={name || "Organization"} 
        className="rounded-[2px]"
        style={hasCustomSize ? { 
          borderRadius: "2px", 
          objectFit: "cover" 
        } : { 
          borderRadius: "2px", 
          width: defaultSize, 
          height: defaultSize, 
          objectFit: "cover" 
        }} 
      />
      <AvatarFallback 
        className={`font-normal bg-muted text-muted-foreground flex items-center justify-center rounded-[2px] ${hasCustomSize ? "text-sm md:text-base" : "text-[10px]"}`}
        style={{ borderRadius: "2px" }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

