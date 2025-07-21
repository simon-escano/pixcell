"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CustomAlertDialog } from "@/components/custom-alert-dialog"
import {
  Loader2,
  Trash2,
  User,
  TestTube,
  FileText,
  Table,
  Eye,
  AlertCircle,
  CheckCircle2,
  Plus,
  Minus,
} from "lucide-react"
import toast from "react-hot-toast"
import { TableEditor, TableDisplay } from "./table-editor"
import { Progress } from "@/components/ui/progress"
import ImprovedReportPreview from "./report-preview";

// Types (keeping the same as original)
import type { Role } from "@/db/schema"

export interface Patient {
  id: string
  firstName: string
  lastName: string
  email: string
  contactNumber: string
  address: string
  height: number
  weight: number
  sex: string
  bloodType: string
  birthDate: string
  createdAt: Date
  imageUrl?: string | null
}

export interface Profile {
  id: string
  firstName: string
  lastName: string
  userId: string
  roleId: string
  imageId?: string
  licenseNo?: string
}

export interface Sample {
  id: string
  patientId: string
  sampleName: string | null
  createdBy: string
  uploadedBy: string | null
  metadata: unknown
  capturedAt: Date | null
  imageId: string | null
  imageUrl: string | null
  createdByName?: string
}

export interface TableData {
  id: string
  title: string
  headers: string[]
  rows: string[][]
}

export interface ReportContent {
  text: string
  tables: TableData[]
}

export interface ReportFormData {
  title: string
  testType: string
  content: string
  isAiGenerated: boolean
  customTestType?: string
}

interface ReportFormProps {
  mode: "create" | "edit"
  onSubmit: (data: any) => Promise<any>
  initialFormData?: ReportFormData
  initialReportContent?: ReportContent
  patients: Patient[]
  profiles: Profile[]
  role: Role
  currentUserId: string
  reportId?: string
  initialPatientId?: string
  initialSampleId?: string
}

export default function ImprovedReportForm({
  mode,
  onSubmit,
  initialFormData,
  initialReportContent,
  patients,
  profiles,
  role,
  currentUserId,
  reportId,
  initialPatientId,
  initialSampleId,
}: ReportFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || "")
  const [samples, setSamples] = useState<Sample[]>([])
  const [selectedSampleId, setSelectedSampleId] = useState<string>(initialSampleId || "")
  const [showPreview, setShowPreview] = useState(false)
  const [showTableEditor, setShowTableEditor] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<ReportFormData>(() => {
    if (initialFormData) {
      return {
        title: initialFormData.title || "",
        testType: ["Blood Test", "Urine Test", "Tissue Analysis", "Microscopy", "Culture Test"].includes(
          initialFormData.testType || ""
        )
          ? initialFormData.testType || ""
          : initialFormData.testType === "other"
            ? "other"
            : initialFormData.testType || "",
        content: initialFormData.content || "",
        isAiGenerated: initialFormData.isAiGenerated || false,
        customTestType: initialFormData.testType &&
          !["Blood Test", "Urine Test", "Tissue Analysis", "Microscopy", "Culture Test"].includes(
            initialFormData.testType
          )
          ? initialFormData.testType
          : "",
      };
    }
    return {
      title: "",
      testType: "",
      content: "",
      isAiGenerated: false,
      customTestType: "",
    };
  });

  const [reportContent, setReportContent] = useState<ReportContent>(() => {
    if (initialReportContent) {
      console.log("Using initialReportContent:", initialReportContent);
      return initialReportContent;
    }
    return { text: "", tables: [] };
  });

  useEffect(() => {
    console.log("Props changed - initialFormData:", initialFormData);
    console.log("Props changed - initialReportContent:", initialReportContent);
    
    if (initialFormData) {
      setFormData({
        title: initialFormData.title || "",
        testType: ["Blood Test", "Urine Test", "Tissue Analysis", "Microscopy", "Culture Test"].includes(
          initialFormData.testType || ""
        )
          ? initialFormData.testType || ""
          : initialFormData.testType === "other"
            ? "other"
            : initialFormData.testType || "",
        content: initialFormData.content || "",
        isAiGenerated: initialFormData.isAiGenerated || false,
        customTestType: initialFormData.testType &&
          !["Blood Test", "Urine Test", "Tissue Analysis", "Microscopy", "Culture Test"].includes(
            initialFormData.testType
          )
          ? initialFormData.testType
          : "",
      });
    }
    
    if (initialReportContent) {
      console.log("Setting reportContent from initialReportContent:", initialReportContent);
      setReportContent(initialReportContent);
    }
  }, [initialFormData, initialReportContent]);

  useEffect(() => {
    if (initialPatientId && patients.some(p => p.id === initialPatientId)) {
      console.log("Setting initial patient ID:", initialPatientId);
      setSelectedPatientId(initialPatientId);
    }
  }, [initialPatientId, patients]);
  
  useEffect(() => {
    if (initialSampleId && samples.some(s => s.id === initialSampleId)) {
      console.log("Setting initial sample ID:", initialSampleId);
      setSelectedSampleId(initialSampleId);
    }
  }, [initialSampleId, samples]);

  // Calculate form completion progress
  const calculateProgress = () => {
    let completed = 0
    const total = 6 // Total required fields

    if (selectedPatientId) completed++
    if (selectedSampleId) completed++
    if (formData.title) completed++
    if (formData.testType) completed++
    if (formData.testType !== "other" || formData.customTestType) completed++
    if (formData.content || reportContent.tables.length > 0) completed++

    return (completed / total) * 100
  }

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedPatientId) newErrors.patient = "Please select a patient"
    if (!selectedSampleId) newErrors.sample = "Please select a sample"
    if (!formData.title) newErrors.title = "Report title is required"
    if (!formData.testType) newErrors.testType = "Test type is required"
    if (formData.testType === "other" && !formData.customTestType) {
      newErrors.customTestType = "Please specify the test type"
    }
    if (!formData.content && reportContent.tables.length === 0) {
      newErrors.content = "Report content or tables are required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Get selected patient and sample data for preview
  const selectedPatient = patients.find((p) => p.id === selectedPatientId)
  const selectedSample = samples.find((s) => s.id === selectedSampleId)

  let selectedSampleWithDoctorName = selectedSample
  if (selectedSample && profiles) {
    const doctor = profiles.find((p) => p.id === selectedSample.createdBy)
    selectedSampleWithDoctorName = {
      ...selectedSample,
      createdByName: doctor ? `${doctor.firstName} ${doctor.lastName}` : selectedSample.createdBy,
    }
  }

  // Fetch samples when patient is selected
  useEffect(() => {
    if (selectedPatientId) {
      const fetchSamples = async () => {
        try {
          const res = await import("@/actions/reports")
          const result = await res.getSamplesByPatientIdAction(selectedPatientId)
          if (result.success && result.data) {
            setSamples(result.data)
            if (!result.data.some((s: any) => s.id === selectedSampleId)) {
              setSelectedSampleId("")
            }
          } else {
            toast.error(result.error || "Failed to fetch samples")
          }
        } catch (error) {
          toast.error("Failed to fetch samples")
        }
      }
      fetchSamples()
    } else {
      setSamples([])
      setSelectedSampleId("")
    }
  }, [selectedPatientId])

  // On mount, fetch samples for the initial patient (edit mode)
  useEffect(() => {
    if (initialPatientId) {
      const fetchSamples = async () => {
        try {
          const res = await import("@/actions/reports")
          const result = await res.getSamplesByPatientIdAction(initialPatientId)
          if (result.success && result.data) {
            setSamples(result.data)
          }
        } catch {}
      }
      fetchSamples()
    }
  }, [initialPatientId])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleTableAdd = (tableData: TableData) => {
    setReportContent((prev) => ({ ...prev, tables: [...prev.tables, tableData] }))
    setShowTableEditor(false)
    toast.success("Table added successfully")
  }

  const handleTableRemove = (tableId: string) => {
    setReportContent((prev) => ({
      ...prev,
      tables: prev.tables.filter((table) => table.id !== tableId),
    }))
    toast.success("Table removed")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    try {
      const submitData: any = {
        title: formData.title,
        content: {
          text: formData.content,
          tables: reportContent.tables,
        },
        testType: formData.testType === "other" ? formData.customTestType : formData.testType,
        isAiGenerated: formData.isAiGenerated,
        status: "Draft",
      }

      if (mode === "create") {
        submitData.patientId = selectedPatientId
        submitData.sampleId = selectedSampleId
        submitData.generatedBy = currentUserId
      }

      const result = await onSubmit(mode === "edit" && reportId ? [reportId, submitData] : submitData)

      if (result.success) {
        toast.success(mode === "edit" ? "Report updated successfully" : "Report created successfully")
        router.push("/reports")
      } else {
        toast.error(result.error || (mode === "edit" ? "Failed to update report" : "Failed to create report"))
      }
    } catch (error) {
      toast.error(mode === "edit" ? "Failed to update report" : "Failed to create report")
    } finally {
      setIsLoading(false)
    }
  }

  const currentUserProfile = profiles.find((p) => p.userId === currentUserId)
  const doctorName = currentUserProfile ? `${currentUserProfile.firstName} ${currentUserProfile.lastName}` : "N/A"
  const doctorRole = role
  const doctorLicense = currentUserProfile && currentUserProfile.licenseNo ? currentUserProfile.licenseNo : "N/A"

  // Deduplicate samples by sample.id for dropdown
  const uniqueSamples = []
  const seenSampleIds = new Set()
  for (const s of samples) {
    if (!seenSampleIds.has(s.id)) {
      uniqueSamples.push(s)
      seenSampleIds.add(s.id)
    }
  }

  const progress = calculateProgress()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {mode === "edit" ? "Edit Report" : "Create New Report"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {mode === "edit"
                  ? "Update the medical report details"
                  : "Fill in the details to generate a comprehensive medical report"}
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Form Completion</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 w-full rounded bg-border" />
          </div>
        </div>

        <div className={`grid gap-8 ${showPreview ? "lg:grid-cols-2" : "lg:grid-cols-1 max-w-4xl mx-auto"}`}>
          {/* Form Section */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Patient & Sample Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Patient & Sample Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="patient" className="text-sm font-medium">
                        Patient *
                      </Label>
                      <Select
                        value={selectedPatientId}
                        onValueChange={(value) => {
                          setSelectedPatientId(value)
                          if (errors.patient) setErrors((prev) => ({ ...prev, patient: "" }))
                        }}
                      >
                        <SelectTrigger aria-invalid={!!errors.patient}>
                          <SelectValue placeholder="Select a patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                                  {patient.firstName[0]}
                                  {patient.lastName[0]}
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">
                                    {patient.firstName} {patient.lastName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{patient.email}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.patient && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.patient}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sample" className="text-sm font-medium">
                        Sample *
                      </Label>
                      <Select
                        value={selectedSampleId}
                        onValueChange={(value) => {
                          setSelectedSampleId(value)
                          if (errors.sample) setErrors((prev) => ({ ...prev, sample: "" }))
                        }}
                        disabled={!selectedPatientId || samples.length === 0}
                      >
                        <SelectTrigger aria-invalid={!!errors.sample}>
                          <SelectValue
                            placeholder={
                              !selectedPatientId
                                ? "Select a patient first"
                                : samples.length === 0
                                  ? "No samples available"
                                  : "Select a sample"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueSamples.map((sample) => (
                            <SelectItem key={sample.id} value={sample.id}>
                              <div className="flex items-center gap-2">
                                <TestTube className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium text-foreground">
                                    {sample.sampleName || `Sample ${sample.id.slice(0, 8)}`}
                                  </div>
                                  <div className="text-xs text-muted-foreground">ID: {sample.id.slice(0, 8).toUpperCase()}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.sample && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.sample}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Selected Patient Info */}
                  {selectedPatient && (
                    <CustomAlertDialog
                      title="Selected Patient"
                      description={
                        <div className="flex items-center justify-between">
                          <div>
                            <strong className="text-foreground">
                              {selectedPatient.firstName} {selectedPatient.lastName}
                            </strong>
                            <div className="text-sm text-muted-foreground mt-1">
                              {selectedPatient.sex} • {selectedPatient.bloodType} • {selectedPatient.email}
                            </div>
                          </div>
                          <Badge variant="secondary">Selected</Badge>
                        </div>
                      }
                      onConfirm={() => {}}
                      confirmText="OK"
                      cancelText=""
                    />
                  )}
                </CardContent>
              </Card>

              {/* Report Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Report Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-medium">
                        Report Title *
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        placeholder="Enter descriptive report title"
                        aria-invalid={!!errors.title}
                      />
                      {errors.title && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.title}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="testType" className="text-sm font-medium">
                        Test Type *
                      </Label>
                      <Select
                        value={formData.testType}
                        onValueChange={(value) => {
                          handleInputChange("testType", value)
                          if (errors.testType) setErrors((prev) => ({ ...prev, testType: "" }))
                        }}
                      >
                        <SelectTrigger aria-invalid={!!errors.testType}>
                          <SelectValue placeholder="Select test type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Blood Test">🩸 Blood Test</SelectItem>
                          <SelectItem value="Urine Test">🧪 Urine Test</SelectItem>
                          <SelectItem value="Tissue Analysis">🔬 Tissue Analysis</SelectItem>
                          <SelectItem value="Microscopy">🔍 Microscopy</SelectItem>
                          <SelectItem value="Culture Test">🧫 Culture Test</SelectItem>
                          <SelectItem value="other">📋 Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.testType && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.testType}
                        </p>
                      )}
                    </div>
                  </div>

                  {formData.testType === "other" && (
                    <div className="space-y-2">
                      <Label htmlFor="customTestType" className="text-sm font-medium">
                        Custom Test Type *
                      </Label>
                      <Input
                        id="customTestType"
                        value={formData.customTestType}
                        onChange={(e) => handleInputChange("customTestType", e.target.value)}
                        placeholder="Please specify the test type"
                        aria-invalid={!!errors.customTestType}
                      />
                      {errors.customTestType && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.customTestType}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Content Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Table className="h-5 w-5" />
                    Report Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Tables Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Data Tables</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTableEditor(!showTableEditor)}
                        className="flex items-center gap-2"
                      >
                        {showTableEditor ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {showTableEditor ? "Hide Table Editor" : "Add Table"}
                      </Button>
                    </div>

                    {showTableEditor && (
                      <Card className="border-dashed">
                        <CardContent className="pt-6">
                          <TableEditor onTableAdd={handleTableAdd} />
                        </CardContent>
                      </Card>
                    )}

                    {reportContent.tables.length > 0 && (
                      <div className="space-y-4">
                        <Label className="text-sm font-medium">Added Tables ({reportContent.tables.length})</Label>
                        {reportContent.tables.map((table) => (
                          <div key={table.id} className="relative group">
                            <Button
                              onClick={() => handleTableRemove(table.id)}
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                              type="button"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            <TableDisplay tableData={table} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Text Content */}
                  <div className="space-y-2">
                    <Label htmlFor="content" className="text-sm font-medium">
                      Report Content *
                    </Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => {
                        handleInputChange("content", e.target.value)
                        if (errors.content) setErrors((prev) => ({ ...prev, content: "" }))
                      }}
                      placeholder="Enter detailed report content, findings, observations, and conclusions..."
                      rows={8}
                      className="resize-none"
                      aria-invalid={!!errors.content}
                    />
                    {errors.content && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.content}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formData.content.length} characters • {reportContent.tables.length} tables added
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Sample Images */}
              {selectedSampleId && samples.filter((s) => s.id === selectedSampleId && s.imageUrl).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TestTube className="h-5 w-5" />
                      Sample Images
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {samples
                        .filter((s) => s.id === selectedSampleId && s.imageUrl)
                        .map((img, idx) => (
                          <div key={img.imageId || idx} className="relative group">
                            <img
                              src={img.imageUrl || ""}
                              alt={`Sample preview ${idx + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-border shadow-sm group-hover:shadow-md transition-shadow"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Form Actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/reports")}
                      disabled={isLoading}
                      className="order-2 sm:order-1"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading || progress < 100} className="order-1 sm:order-2">
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {mode === "edit" ? "Update Report" : "Create Report"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="lg:sticky lg:top-8 lg:h-fit">
              <ImprovedReportPreview
                formData={formData}
                reportContent={reportContent}
                selectedPatient={selectedPatient}
                selectedSample={selectedSampleWithDoctorName}
                doctorName={doctorName}
                doctorRole={doctorRole}
                doctorLicense={doctorLicense}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
