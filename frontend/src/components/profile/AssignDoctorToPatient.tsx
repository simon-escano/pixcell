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
  GraduationCap,
  MapPin,
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
  onUpdate,
}: {
  patientId: string
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
        const res = await fetch("/api/doctors")
        if (res.ok) {
          const allDoctors = await res.json()
          setDoctors(allDoctors)
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
  }, [])

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
    <Card className="animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-muted rounded"></div>
          <div className="w-12 h-12 bg-muted rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-muted rounded animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <DoctorSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full shadow-lg border-2 border-border/50 bg-card/80 backdrop-blur-sm">


      <CardContent className="p-6">
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search doctors by name, specialty, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border/50"
            />
          </div>
          <div className="flex gap-2">
            {specialties.length > 0 && (
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="px-3 py-2 border border-border/50 rounded-md bg-background text-sm"
              >
                <option value="all">All Specialties</option>
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            )}
            <Button
              variant={showAssignedOnly ? "default" : "outline"}
              onClick={() => setShowAssignedOnly(!showAssignedOnly)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showAssignedOnly ? "Show All" : "Assigned Only"}
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {bulkMode && (
          <Card className="mb-6 bg-muted/30 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium">Bulk Actions Mode</div>
                    <div className="text-sm text-muted-foreground">{selectedDoctors.length} doctors selected</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAssign(true)}
                    disabled={selectedDoctors.length === 0}
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Assign Selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAssign(false)}
                    disabled={selectedDoctors.length === 0}
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Remove Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Doctor List */}
        {filteredDoctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/10 rounded-full flex items-center justify-center mb-4">
              {doctors.length === 0 ? (
                <Stethoscope className="h-10 w-10 text-muted-foreground" />
              ) : (
                <Search className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {doctors.length === 0 ? "No doctors available" : "No doctors found"}
            </h3>
            <p className="text-muted-foreground max-w-md">
              {doctors.length === 0
                ? "There are no doctors in the system yet. Doctors will appear here once they are registered."
                : "Try adjusting your search terms or filters to find the doctors you're looking for."}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {filteredDoctors.map((doctor) => {
                const isAssigned = assignedDoctorIds.includes(doctor.id)
                const isUpdating = updating === doctor.id
                const isSelected = selectedDoctors.includes(doctor.id)

                return (
                  <Card
                    key={doctor.id}
                    className={`transition-all duration-200 hover:shadow-md ${
                      isAssigned
                        ? "bg-gradient-to-r from-chart-4/10 to-chart-4/5 border-chart-4/30"
                        : "bg-card hover:bg-muted/30"
                    } ${isSelected ? "ring-2 ring-primary/50" : ""}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Checkbox */}
                        <div className="flex items-center gap-2">
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
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                        </div>

                        {/* Avatar */}
                        <Avatar className="h-12 w-12 ring-2 ring-border">
                          <AvatarImage src={doctor.imageUrl || ""} alt={`Dr. ${doctor.firstName} ${doctor.lastName}`} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            Dr.{doctor.firstName[0]}
                            {doctor.lastName[0]}
                          </AvatarFallback>
                        </Avatar>

                        {/* Doctor Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">
                              Dr. {doctor.firstName} {doctor.lastName}
                            </h4>
                            {isAssigned && (
                              <Badge variant="secondary" className="bg-chart-4/20 text-chart-4 text-xs">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Assigned
                              </Badge>
                            )}
                            {doctor.specialty && (
                              <Badge variant="outline" className="text-xs">
                                <GraduationCap className="w-3 h-3 mr-1" />
                                {doctor.specialty}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {doctor.email}
                            </div>
                            {doctor.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {doctor.phone}
                              </div>
                            )}
                            {doctor.department && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {doctor.department}
                              </div>
                            )}
                          </div>
                          {doctor.experience && (
                            <div className="text-xs text-muted-foreground mt-1">{doctor.experience} experience</div>
                          )}
                        </div>

                        {/* Status Indicator */}
                        <div className="flex items-center">
                          {isAssigned ? (
                            <div className="flex items-center gap-1 text-chart-4">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <AlertCircle className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        )}

        {/* Summary */}
        {filteredDoctors.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Showing {filteredDoctors.length} of {doctors.length} doctors
                {searchTerm && ` matching "${searchTerm}"`}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-chart-4 rounded-full"></div>
                  Assigned ({assignedDoctorIds.length})
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                  Available ({doctors.length - assignedDoctorIds.length})
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
