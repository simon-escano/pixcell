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
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Filter,
  Sparkles,
} from "lucide-react"

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
            <PatientSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          Assign Patients
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Compact Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
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
              <span className="text-sm font-medium">{selectedPatients.length} selected</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAssign(true)}
                disabled={selectedPatients.length === 0}
              >
                <UserCheck className="w-4 h-4 mr-1" />
                Assign
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAssign(false)}
                disabled={selectedPatients.length === 0}
              >
                <UserX className="w-4 h-4 mr-1" />
                Unassign
              </Button>
            </div>
          </div>
        )}

        {/* Compact Patient List */}
        {filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
              {patients.length === 0 ? (
                <Users className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Search className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <h3 className="font-medium text-foreground mb-1">
              {patients.length === 0 ? "No patients available" : "No patients found"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {patients.length === 0
                ? "Patients will appear here once they are registered."
                : "Try adjusting your search terms or filters."}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[320px] w-full">
            <div className="space-y-2 w-full">
              {filteredPatients.map((patient) => {
                const isAssigned = assignedPatientIds.includes(patient.id)
                const isUpdating = updating === patient.id
                const isSelected = selectedPatients.includes(patient.id)

                return (
                  <div
                    key={patient.id}
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
                              setSelectedPatients((prev) => [...prev, patient.id])
                            } else {
                              setSelectedPatients((prev) => prev.filter((id) => id !== patient.id))
                            }
                          } else {
                            handleToggle(patient.id, !!checked)
                          }
                        }}
                        disabled={isUpdating}
                      />
                      {isUpdating && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                    </div>

                    {/* Avatar - Fixed width */}
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={patient.imageUrl || ""} alt={`${patient.firstName} ${patient.lastName}`} />
                      <AvatarFallback className="text-xs">
                        {patient.firstName[0]}
                        {patient.lastName[0]}
                      </AvatarFallback>
                    </Avatar>

                    {/* Patient Info - Flexible width with proper truncation */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-1 mb-1 flex-wrap">
                        <span className="font-medium text-sm truncate max-w-[120px]">
                          {patient.firstName} {patient.lastName}
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
                      </div>
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{patient.email}</span>
                        </div>
                        {patient.phone && (
                          <div className="flex items-center gap-1 truncate">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{patient.phone}</span>
                          </div>
                        )}
                        {patient.dateOfBirth && (
                          <div className="flex items-center gap-1 truncate">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{new Date(patient.dateOfBirth).toLocaleDateString()}</span>
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
        {filteredPatients.length > 0 && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {filteredPatients.length} of {patients.length} patients
                {searchTerm && ` matching "${searchTerm}"`}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Assigned ({assignedCount})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                  <span>Unassigned ({totalCount - assignedCount})</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Toggle Bulk Mode */}
        {filteredPatients.length > 0 && (
          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBulkMode(!bulkMode)
                setSelectedPatients([])
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
