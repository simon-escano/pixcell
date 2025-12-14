"use client"

import { useEffect, useState } from "react"
import { MapPin } from "lucide-react"
import { extractImageColors, type ImageColors } from "@/lib/image-color-utils"
import { OrganizationAvatar } from "./organization-avatar"

interface OrganizationBannerProps {
  name: string | null
  address: string | null
  imageUrl: string | null
  samples: number
  reports: number
  patients: number
  users: number
}

export function OrganizationBanner({
  name,
  address,
  imageUrl,
  samples,
  reports,
  patients,
  users,
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
    <div
      className="relative overflow-hidden p-4 sm:p-4 md:p-6 lg:p-8 rounded-xl shadow-xl"
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

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Organization Info */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-center gap-3 mb-3">
            <OrganizationAvatar imageUrl={imageUrl} name={name} className="size-8 md:size-12" />
            <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
              {name || "Unnamed Organization"}
            </h1>
          </div>
          {address && (
            <div className="flex items-center gap-2 text-white/80 ml-0 md:ml-0 text-sm md:text-base">
              <MapPin className="size-4 flex-shrink-0" />
              <span>{address}</span>
            </div>
          )}
        </div>

        {/* Stats Grid - Embedded in Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="py-1 px-2 md:py-2 md:px-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-200">
            <p className="text-xs font-medium text-white/70 mb-1">Samples</p>
            <p className="text-xl md:text-2xl font-semibold text-white flex items-baseline gap-2">
              {samples}
            </p>
          </div>

          <div className="py-1 px-2 md:py-2 md:px-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-200">
            <p className="text-xs font-medium text-white/70 mb-1">Reports</p>
            <p className="text-xl md:text-2xl font-semibold text-white flex items-baseline gap-2">
              {reports}
            </p>
          </div>

          <div className="py-1 px-2 md:py-2 md:px-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-200">
            <p className="text-xs font-medium text-white/70 mb-1">Patients</p>
            <p className="text-xl md:text-2xl font-semibold text-white flex items-baseline gap-2">
              {patients}
            </p>
          </div>

          <div className="py-1 px-2 md:py-2 md:px-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-200">
            <p className="text-xs font-medium text-white/70 mb-1">Staff</p>
            <p className="text-xl md:text-2xl font-semibold text-white flex items-baseline gap-2">
              {users}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

