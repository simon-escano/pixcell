"use client"

import { useEffect, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "react-hot-toast"
import {
  Search,
  UserCheck,
  UserX,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Stethoscope,
  Filter,
  UserPlus,
  Sparkles,
} from "lucide-react"

interface Doctor {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  specialty?: string
  department?: string
  imageUrl?: string
  experience?: string
  location?: string
}

export default function AssignDoctorToPatient({
  patientId,
  organizationId,
  onUpdate,
}: {
  patientId: string
  organizationId?: string
  onUpdate?: () => void
}) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [assignedDoctorIds, setAssignedDoctorIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAssignedOnly, setShowAssignedOnly] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([])
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all")

  // Fetch all doctors
  useEffect(() => {
    async function fetchDoctors() {
      setLoading(true)
      try {
        const url = organizationId ? `/api/doctors?organizationId=${organizationId}` : "/api/doctors"
        const res = await fetch(url)
        if (res.ok) {
          const allDoctors = await res.json()
          // Deduplicate doctors by id since a user can have doctor role in multiple organizations
          const deduplicatedDoctors = Array.from(new Map((allDoctors as Doctor[]).map((doc: Doctor) => [doc.id, doc])).values())
          setDoctors(deduplicatedDoctors)
        } else {
          toast.error("Failed to load doctors")
        }
      } catch (error) {
        toast.error("Failed to load doctors")
      } finally {
        setLoading(false)
      }
    }
    fetchDoctors()
  }, [organizationId])

  // Fetch assigned doctors for this patient
  useEffect(() => {
    async function fetchAssignedDoctors() {
      if (patientId) {
        try {
          const res = await fetch(`/api/patients/${patientId}/doctors`)
          if (res.ok) {
            const data = await res.json()
            setAssignedDoctorIds(data.map((doc: any) => doc.id))
          }
        } catch (error) {
          console.error("Failed to fetch assigned doctors:", error)
        }
      }
    }
    fetchAssignedDoctors()
  }, [patientId])

  const handleToggle = async (doctorId: string, checked: boolean) => {
    setUpdating(doctorId)
    // Optimistic update
    if (checked) {
      setAssignedDoctorIds((prev) => [...prev, doctorId])
    } else {
      setAssignedDoctorIds((prev) => prev.filter((id) => id !== doctorId))
    }

    try {
      if (checked) {
        await fetch(`/api/patients/${patientId}/doctors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ doctorId }),
        })
        toast.success("Doctor assigned successfully")
      } else {
        await fetch(`/api/patients/${patientId}/doctors?doctorId=${doctorId}`, {
          method: "DELETE",
        })
        toast.success("Doctor removed successfully")
      }
      if (onUpdate) onUpdate()
    } catch (error) {
      // Revert optimistic update on error
      if (checked) {
        setAssignedDoctorIds((prev) => prev.filter((id) => id !== doctorId))
      } else {
        setAssignedDoctorIds((prev) => [...prev, doctorId])
      }
      toast.error("Failed to update doctor assignment")
    } finally {
      setUpdating(null)
    }
  }

  const handleBulkAssign = async (assign: boolean) => {
    if (selectedDoctors.length === 0) return
    setLoading(true)
    const toastId = toast.loading(`${assign ? "Assigning" : "Removing"} ${selectedDoctors.length} doctors...`)

    try {
      const promises = selectedDoctors.map((doctorId) =>
        assign
          ? fetch(`/api/patients/${patientId}/doctors`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ doctorId }),
            })
          : fetch(`/api/patients/${patientId}/doctors?doctorId=${doctorId}`, {
              method: "DELETE",
            }),
      )

      await Promise.all(promises)

      if (assign) {
        setAssignedDoctorIds((prev) => [...new Set([...prev, ...selectedDoctors])])
      } else {
        setAssignedDoctorIds((prev) => prev.filter((id) => !selectedDoctors.includes(id)))
      }

      toast.success(`Successfully ${assign ? "assigned" : "removed"} ${selectedDoctors.length} doctors`, {
        id: toastId,
      })
      setSelectedDoctors([])
      setBulkMode(false)
      if (onUpdate) onUpdate()
    } catch (error) {
      toast.error(`Failed to ${assign ? "assign" : "remove"} doctors`, { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  // Get unique specialties for filter
  const specialties = [...new Set(doctors.map((doc) => doc.specialty).filter(Boolean))]

  // Filter doctors based on search, assignment status, and specialty
  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.department?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = showAssignedOnly ? assignedDoctorIds.includes(doctor.id) : true
    const matchesSpecialty = specialtyFilter === "all" || doctor.specialty === specialtyFilter

    return matchesSearch && matchesFilter && matchesSpecialty
  })

  // Loading skeleton
  const DoctorSkeleton = () => (
    <div className="flex items-center gap-3 p-3 border rounded-lg animate-pulse">
      <div className="w-4 h-4 bg-muted rounded"></div>
      <div className="w-8 h-8 bg-muted rounded-full"></div>
      <div className="flex-1 space-y-1">
        <div className="h-3 bg-muted rounded w-3/4"></div>
        <div className="h-2 bg-muted rounded w-1/2"></div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted rounded animate-pulse"></div>
            <div className="h-5 bg-muted rounded w-40 animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <DoctorSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Assign Doctors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Compact Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="px-3 py-1.5 border rounded-md bg-background text-sm h-9 min-w-[120px]"
          >
            <option value="all">All Specialties</option>
            {specialties.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
          <Button
            variant={showAssignedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAssignedOnly(!showAssignedOnly)}
            className="h-9"
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Compact Bulk Actions */}
        {bulkMode && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{selectedDoctors.length} selected</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAssign(true)}
                disabled={selectedDoctors.length === 0}
              >
                <UserCheck className="w-4 h-4 mr-1" />
                Assign
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAssign(false)}
                disabled={selectedDoctors.length === 0}
              >
                <UserX className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        )}

        {/* Compact Doctor List */}
        {filteredDoctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
              {doctors.length === 0 ? (
                <Stethoscope className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Search className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <h3 className="font-medium text-foreground mb-1">
              {doctors.length === 0 ? "No doctors available" : "No doctors found"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {doctors.length === 0
                ? "Doctors will appear here once they are registered."
                : "Try adjusting your search terms or filters."}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[320px] w-full">
            <div className="space-y-2 w-full">
              {filteredDoctors.map((doctor) => {
                const isAssigned = assignedDoctorIds.includes(doctor.id)
                const isUpdating = updating === doctor.id
                const isSelected = selectedDoctors.includes(doctor.id)

                return (
                  <div
                    key={doctor.id}
                    className={`flex items-center gap-2 p-3 border rounded-lg transition-colors ${
                      isAssigned
                        ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/30"
                        : "hover:bg-muted/50"
                    } ${isSelected ? "ring-2 ring-primary/50" : ""}`}
                  >
                    {/* Checkbox - Fixed width */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Checkbox
                        checked={bulkMode ? isSelected : isAssigned}
                        onCheckedChange={(checked) => {
                          if (bulkMode) {
                            if (checked) {
                              setSelectedDoctors((prev) => [...prev, doctor.id])
                            } else {
                              setSelectedDoctors((prev) => prev.filter((id) => id !== doctor.id))
                            }
                          } else {
                            handleToggle(doctor.id, !!checked)
                          }
                        }}
                        disabled={isUpdating}
                      />
                      {isUpdating && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                    </div>

                    {/* Avatar - Fixed width */}
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={doctor.imageUrl || ""} alt={`Dr. ${doctor.firstName} ${doctor.lastName}`} />
                      <AvatarFallback className="text-xs">
                        {doctor.firstName[0]}
                        {doctor.lastName[0]}
                      </AvatarFallback>
                    </Avatar>

                    {/* Doctor Info - Flexible width with proper truncation */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-1 mb-1 flex-wrap">
                        <span className="font-medium text-sm truncate max-w-[120px]">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </span>
                        {isAssigned && (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 flex-shrink-0"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                            Assigned
                          </Badge>
                        )}
                        {doctor.specialty && (
                          <Badge
                            variant="outline"
                            className="text-xs px-1.5 py-0.5 flex-shrink-0 max-w-[80px] truncate"
                          >
                            {doctor.specialty}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{doctor.email}</span>
                        </div>
                        {doctor.phone && (
                          <div className="flex items-center gap-1 truncate">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{doctor.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Indicator - Fixed width */}
                    <div className="flex-shrink-0">
                      {isAssigned ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}

        {/* Compact Summary */}
        {filteredDoctors.length > 0 && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {filteredDoctors.length} of {doctors.length} doctors
                {searchTerm && ` matching "${searchTerm}"`}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Assigned ({assignedDoctorIds.length})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                  <span>Available ({doctors.length - assignedDoctorIds.length})</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Toggle Bulk Mode */}
        {filteredDoctors.length > 0 && (
          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBulkMode(!bulkMode)
                setSelectedDoctors([])
              }}
              className="text-xs"
            >
              {bulkMode ? "Exit Bulk Mode" : "Bulk Actions"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
