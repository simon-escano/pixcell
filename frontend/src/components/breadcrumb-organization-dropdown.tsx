"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { OrganizationAvatar } from "./organization-avatar"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { setLastSelectedOrganizationId } from "@/lib/organization-storage"

interface BreadcrumbOrganizationDropdownProps {
  organizations: {
    id: string
    name: string | null
    imageUrl: string | null
  }[]
}

export function BreadcrumbOrganizationDropdown({ organizations }: BreadcrumbOrganizationDropdownProps) {
  const router = useRouter()
  const pathname = usePathname() || ""
  const [currentOrgId, setCurrentOrgId] = useState<string>("")

  useEffect(() => {
    const segments = pathname.split("/")
    const orgIndex = segments.indexOf("organizations")
    
    if (orgIndex !== -1 && segments.length > orgIndex + 1) {
      const orgId = segments[orgIndex + 1]
      if (orgId && organizations.some(org => org.id === orgId)) {
        setCurrentOrgId(orgId)
      }
    }
  }, [pathname, organizations])

  const handleChange = (orgId: string) => {
    // Save to localStorage
    setLastSelectedOrganizationId(orgId)
    
    const segments = pathname.split("/")
    const orgIndex = segments.indexOf("organizations")
    
    if (orgIndex !== -1 && segments.length > orgIndex + 1) {
      // Replace the old Org ID with the new one
      segments[orgIndex + 1] = orgId
      const newPath = segments.join("/") || "/"
      router.push(newPath)
    } else {
      // Fallback: go to organization page
      router.push(`/organizations/${orgId}`)
    }
  }

  const currentOrg = organizations.find(org => org.id === currentOrgId)

  if (!currentOrg) {
    return null
  }

  return (
    <Select value={currentOrgId} onValueChange={handleChange}>
      <SelectTrigger className="w-auto min-w-[80px] max-w-[150px] border shadow-none bg-transparent hover:bg-accent overflow-hidden">
        <div className="flex items-center gap-1.5 min-w-0 w-full overflow-hidden">
          <OrganizationAvatar imageUrl={currentOrg.imageUrl} name={currentOrg.name} className="flex-shrink-0" />
          <SelectValue className="min-w-0 flex-1! truncate! overflow-hidden! flex! w-full!">
            <span className="overflow-hidden flex-1 truncate block">{currentOrg.name || "Unnamed Organization"}</span>
          </SelectValue>
        </div>
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
  )
}

