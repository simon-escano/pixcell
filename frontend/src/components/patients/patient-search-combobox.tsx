"use client"

import type { MetaPatient } from "@/app/samples/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/utils"
import { Check, ChevronsUpDown } from "lucide-react"
import * as React from "react"

export const getPatientInitials = (patient: MetaPatient) => {
  if (!patient.fullName) return ""
  const names = patient.fullName.split(" ")
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase()
  }
  return names.map((name) => name.charAt(0).toUpperCase()).join("")
}

export function PatientSearchCombobox({
  patients,
  value,
  onChange,
}: {
  patients: MetaPatient[]
  value: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [patientImages, setPatientImages] = React.useState<Record<string, string | null>>({})

  const filteredPatients = patients.filter((p) => {
    const term = searchTerm.toLowerCase().trim()
    if (term === "") return true
    const individualMatch = p.fullName.toLowerCase().includes(term) || p.email.toLowerCase().includes(term)
    const fullNameMatch = p.fullName.includes(term)
    const searchTerms = term.split(/\s+/)
    const multiTermMatch = searchTerms.every(
      (term) => p.fullName.toLowerCase().includes(term) || p.email.toLowerCase().includes(term),
    )
    return individualMatch || fullNameMatch || multiTermMatch
  })

  const selected = patients.find((p) => p.id === value)
  const selectedName = selected?.fullName

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-transparent min-w-0"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selected && (
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarImage src={patientImages[selected.id] || undefined} alt={selectedName} />
                <AvatarFallback className="text-xs">{getPatientInitials(selected)}</AvatarFallback>
              </Avatar>
            )}
            <span className="truncate flex-1 text-left">
              {selected ? `${selectedName} (${selected.email})` : "Select a patient..."}
            </span>
          </div>
          <ChevronsUpDown className="h-4 w-4 flex-shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search a patient..." value={searchTerm} onValueChange={setSearchTerm} />
          <CommandList>
            <CommandEmpty>No patient found.</CommandEmpty>
            <CommandGroup>
              {filteredPatients.map((patient) => {
                console.log(patient.fullName)
                return (
                  <CommandItem
                    key={patient.id}
                    value={`${patient.fullName} ${patient.email}`.toLowerCase()}
                    onSelect={() => {
                      onChange(patient.id)
                      setOpen(false)
                    }}
                    className="flex items-center gap-3 p-3"
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={patientImages[patient.id] || undefined} alt={patient.fullName} />
                      <AvatarFallback className="text-sm">{getPatientInitials(patient)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium truncate">{patient.fullName}</span>
                      <span className="text-sm text-muted-foreground truncate">{patient.email}</span>
                    </div>
                    <Check
                      className={cn("h-4 w-4 flex-shrink-0", value === patient.id ? "opacity-100" : "opacity-0")}
                    />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
