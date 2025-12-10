"use client"

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Building, MoveRight } from 'lucide-react';
import Link from "next/link";

interface OrganizationDropdownProps {
    organizations: { 
        id: string,
        name: string | null,
        address: string | null,
        createdAt: Date,
        updatedAt: Date
    }[];
}

const OrganizationDropdown = ({ organizations }: OrganizationDropdownProps) => {
  return (
    <div className='flex flex-col gap-2 p-2 border rounded-xl items-start'>
        <Link href="/organizations" className="flex justify-between w-full items-center gap-2 rounded-md hover:bg-accent px-2 py-1">
            <p className="text-xs text-muted-foreground">Organization</p>
            <MoveRight className="size-4 text-muted-foreground" />
        </Link>
        <Select defaultValue={organizations[0]?.id || ""}>
            <SelectTrigger className="w-full text-foreground">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}><Building className='size-4'/>{org.name || "Unnamed Organization"}</SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    </div>
  )
}

export default OrganizationDropdown