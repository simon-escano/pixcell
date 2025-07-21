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
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Search, Users, UserCheck, UserX, Loader2, CheckCircle2, AlertCircle, Mail, Phone, Calendar, Filter, UserPlus, Sparkles } from 'lucide-react'

interface Patient {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: string
  imageUrl?: string
  status?: string
}

export default function AssignPatientToDoctor({ doctorId: propDoctorId }: { doctorId?: string }) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [assignedPatientIds, setAssignedPatientIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [doctorId, setDoctorId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showAssignedOnly, setShowAssignedOnly] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedPatients, setSelectedPatients] = useState<string[]>([])

  useEffect(() => {
    async function fetchDoctorIdAndPatients() {
      setLoading(true)
      try {
        let useDoctorId = propDoctorId

        if (!useDoctorId) {
          const supabase = createClientComponentClient()
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user) {
            const { data: profile } = await supabase.from("profile").select("id").eq("user_id", user.id).single()
            if (profile) {
              useDoctorId = profile.id
            }
          }
        }

        if (useDoctorId) {
          setDoctorId(useDoctorId)
          const res = await fetch(`/api/doctors/${useDoctorId}/patients`)
          if (res.ok) {
            const { allPatients, assignedPatientIds } = await res.json()
            setPatients(allPatients)
            setAssignedPatientIds(assignedPatientIds)
          } else {
            toast.error("Failed to load patients")
          }
        }
      } catch (error) {
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchDoctorIdAndPatients()
  }, [propDoctorId])

  const handleToggle = async (patientId: string, checked: boolean) => {
    if (!doctorId) return

    setUpdating(patientId)
    
    // Optimistic update
    if (checked) {
      setAssignedPatientIds((prev) => [...prev, patientId])
    } else {
      setAssignedPatientIds((prev) => prev.filter((id) => id !== patientId))
    }

    try {
      if (checked) {
        await fetch(`/api/doctors/${doctorId}/patients`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId }),
        })
        toast.success("Patient assigned successfully")
      } else {
        await fetch(`/api/doctors/${doctorId}/patients?patientId=${patientId}`, {
          method: "DELETE",
        })
        toast.success("Patient unassigned successfully")
      }
    } catch (error) {
      // Revert optimistic update on error
      if (checked) {
        setAssignedPatientIds((prev) => prev.filter((id) => id !== patientId))
      } else {
        setAssignedPatientIds((prev) => [...prev, patientId])
      }
      toast.error("Failed to update patient assignment")
    } finally {
      setUpdating(null)
    }
  }

  const handleBulkAssign = async (assign: boolean) => {
    if (!doctorId || selectedPatients.length === 0) return

    setLoading(true)
    const toastId = toast.loading(`${assign ? "Assigning" : "Unassigning"} ${selectedPatients.length} patients...`)

    try {
      const promises = selectedPatients.map((patientId) =>
        assign
          ? fetch(`/api/doctors/${doctorId}/patients`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ patientId }),
            })
          : fetch(`/api/doctors/${doctorId}/patients?patientId=${patientId}`, {
              method: "DELETE",
            }),
      )

      await Promise.all(promises)

      if (assign) {
        setAssignedPatientIds((prev) => [...new Set([...prev, ...selectedPatients])])
      } else {
        setAssignedPatientIds((prev) => prev.filter((id) => !selectedPatients.includes(id)))
      }

      toast.success(`Successfully ${assign ? "assigned" : "unassigned"} ${selectedPatients.length} patients`, {
        id: toastId,
      })
      setSelectedPatients([])
      setBulkMode(false)
    } catch (error) {
      toast.error(`Failed to ${assign ? "assign" : "unassign"} patients`, { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  // Filter patients based on search and assignment status
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = showAssignedOnly ? assignedPatientIds.includes(patient.id) : true

    return matchesSearch && matchesFilter
  })

  const assignedCount = assignedPatientIds.length
  const totalCount = patients.length

  // Loading skeleton
  const PatientSkeleton = () => (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-muted rounded"></div>
          <div className="w-10 h-10 bg-muted rounded-full"></div>
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
            <PatientSkeleton key={i} />
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
              placeholder="Search patients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border/50"
            />
          </div>
          <Button
            variant={showAssignedOnly ? "default" : "outline"}
            onClick={() => setShowAssignedOnly(!showAssignedOnly)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {showAssignedOnly ? "Show All" : "Assigned Only"}
          </Button>
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
                    <div className="text-sm text-muted-foreground">
                      {selectedPatients.length} patients selected
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAssign(true)}
                    disabled={selectedPatients.length === 0}
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Assign Selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAssign(false)}
                    disabled={selectedPatients.length === 0}
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Unassign Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Patient List */}
        {filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/10 rounded-full flex items-center justify-center mb-4">
              {patients.length === 0 ? (
                <Users className="h-10 w-10 text-muted-foreground" />
              ) : (
                <Search className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {patients.length === 0 ? "No patients available" : "No patients found"}
            </h3>
            <p className="text-muted-foreground max-w-md">
              {patients.length === 0
                ? "There are no patients in the system yet. Patients will appear here once they are registered."
                : "Try adjusting your search terms or filters to find the patients you're looking for."}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {filteredPatients.map((patient) => {
                const isAssigned = assignedPatientIds.includes(patient.id)
                const isUpdating = updating === patient.id
                const isSelected = selectedPatients.includes(patient.id)

                return (
                  <Card
                    key={patient.id}
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
                                  setSelectedPatients((prev) => [...prev, patient.id])
                                } else {
                                  setSelectedPatients((prev) => prev.filter((id) => id !== patient.id))
                                }
                              } else {
                                handleToggle(patient.id, !!checked)
                              }
                            }}
                            disabled={isUpdating}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                        </div>

                        {/* Avatar */}
                        <Avatar className="h-12 w-12 ring-2 ring-border">
                          <AvatarImage src={patient.imageUrl || ""} alt={`${patient.firstName} ${patient.lastName}`} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {patient.firstName[0]}
                            {patient.lastName[0]}
                          </AvatarFallback>
                        </Avatar>

                        {/* Patient Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">
                              {patient.firstName} {patient.lastName}
                            </h4>
                            {isAssigned && (
                              <Badge variant="secondary" className="bg-chart-4/20 text-chart-4 text-xs">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Assigned
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {patient.email}
                            </div>
                            {patient.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {patient.phone}
                              </div>
                            )}
                            {patient.dateOfBirth && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(patient.dateOfBirth).toLocaleDateString()}
                              </div>
                            )}
                          </div>
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
        {filteredPatients.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Showing {filteredPatients.length} of {patients.length} patients
                {searchTerm && ` matching "${searchTerm}"`}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-chart-4 rounded-full"></div>
                  Assigned ({assignedCount})
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                  Unassigned ({totalCount - assignedCount})
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
