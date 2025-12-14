"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { MoveRight } from "lucide-react"
import { OrganizationAvatar } from "./organization-avatar"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

interface OrganizationDropdownProps {
  organizations: {
    id: string
    name: string | null
    address: string | null
    createdAt: Date
    updatedAt: Date
    imageUrl: string | null
  }[]
}

const OrganizationDropdown = ({ organizations }: OrganizationDropdownProps) => {
  const router = useRouter()
  const pathname = usePathname() || ""

  const segments = pathname.split("/")
  const orgIndex = segments.indexOf("organizations")
  
  // Determine current org ID from URL, fallback to first org, or empty string
  const currentOrgId =
    orgIndex !== -1 && segments.length > orgIndex + 1
      ? segments[orgIndex + 1]
      : ""

  const handleChange = (orgId: string) => {
    const updatedSegments = [...segments]
    
    // If we are currently inside a path that has the organization ID
    if (orgIndex !== -1 && updatedSegments.length > orgIndex + 1) {
      // If we're on the dashboard route, redirect to organization page
      if (updatedSegments[orgIndex + 2] === "dashboard") {
        router.push(`/organizations/${orgId}`)
        return
      }
      // Replace the old Org ID with the new one
      updatedSegments[orgIndex + 1] = orgId
      const newPath = updatedSegments.join("/") || "/"
      router.push(newPath)
    } else {
      // Fallback: If logic fails or we are on a root page, go to organization page
      router.push(`/organizations/${orgId}`)
    }
  }

  return (
    <div className="flex flex-col gap-2 p-2 border rounded-xl items-start">
      <Link
        href="/organizations"
        className="flex justify-between w-full items-center gap-2 rounded-md hover:bg-accent px-2 py-1"
      >
        <p className="text-xs text-muted-foreground">Organization</p>
        <MoveRight className="size-4 text-muted-foreground" />
      </Link>
      <Select value={currentOrgId} onValueChange={handleChange}>
        <SelectTrigger className="w-full text-foreground">
          <SelectValue placeholder="Select Organization" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {organizations.map(org => (
              <SelectItem key={org.id} value={org.id}>
                <div className="flex items-center gap-2">
                  <OrganizationAvatar imageUrl={org.imageUrl} name={org.name} />
                  <span>{org.name || "Unnamed Organization"}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export default OrganizationDropdown