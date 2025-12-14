"use client"

import { useEffect, useState } from "react"
import { MapPin } from "lucide-react"
import { extractImageColors, type ImageColors } from "@/lib/image-color-utils"
import { OrganizationAvatar } from "./organization-avatar"

interface OrganizationBannerProps {
  name: string | null
  address: string | null
  imageUrl: string | null
}

export function OrganizationBanner({
  name,
  address,
  imageUrl,
}: OrganizationBannerProps) {
  const [colors, setColors] = useState<ImageColors>({
    lightColor: "#4b5563",
    darkColor: "#1f2937",
    primaryColor: "#374151",
  })

  useEffect(() => {
    if (imageUrl) {
      extractImageColors(imageUrl)
        .then(setColors)
        .catch(() => {
          // Keep default colors on error
        })
    }
  }, [imageUrl])

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div
        className="relative overflow-hidden p-12 sm:p-12 md:p-14 lg:p-16 shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${colors.lightColor} 0%, ${colors.darkColor} 100%)`,
        }}
      >
        {/* Background accent */}
        <div
          className="absolute top-0 right-0 w-96 h-96 opacity-10 rounded-full blur-3xl"
          style={{ backgroundColor: colors.primaryColor }}
        />
        <div
          className="absolute bottom-0 left-0 w-72 h-72 opacity-10 rounded-full blur-3xl"
          style={{ backgroundColor: colors.primaryColor }}
        />
      </div>
      <div className="flex relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-10">
          {/* Organization Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 md:mb-6 flex-1">
            <div className="flex items-center gap-3">
              <OrganizationAvatar imageUrl={imageUrl} name={name} className="size-8 md:size-12" />
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                {name || "Unnamed Organization"}
              </h1>
            </div>
            {address && (
              <div className="flex items-center gap-2 text-foreground/80 ml-0 md:ml-0 text-sm md:text-base">
                <MapPin className="size-4 flex-shrink-0" />
                <span>{address}</span>
              </div>
            )}
          </div>
        </div>
    </div>
  )
}

