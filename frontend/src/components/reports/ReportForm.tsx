import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { TableEditor, TableDisplay } from "./table-editor";
import ReportPreview from "./report-preview";

// Types
import { Role } from "@/db/schema";

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  address: string;
  height: number;
  weight: number;
  sex: string;
  bloodType: string;
  birthDate: string;
  createdAt: Date;
  imageUrl?: string | null;
}

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  userId: string;
  roleId: string;
  imageId?: string;
  licenseNo?: string;
}

export interface Sample {
  id: string;
  patientId: string;
  sampleName: string | null;
  createdBy: string;
  uploadedBy: string | null;
  metadata: unknown;
  capturedAt: Date | null;
  imageId: string | null;
  imageUrl: string | null;
  createdByName?: string;
}

export interface TableData {
  id: string;
  title: string;
  headers: string[];
  rows: string[][];
}

export interface ReportContent {
  text: string;
  tables: TableData[];
}

export interface ReportFormData {
  title: string;
  testType: string;
  content: string;
  isAiGenerated: boolean;
  customTestType?: string;
}

interface ReportFormProps {
  mode: "create" | "edit";
  onSubmit: (data: any) => Promise<any>;
  initialFormData?: ReportFormData;
  initialReportContent?: ReportContent;
  patients: Patient[];
  profiles: Profile[];
  role: Role;
  currentUserId: string;
  reportId?: string;
  initialPatientId?: string;
  initialSampleId?: string;
}

export default function ReportForm({
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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || "");
  const [samples, setSamples] = useState<Sample[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(initialSampleId || "");
  const [formData, setFormData] = useState<ReportFormData>({
    title: initialFormData?.title || "",
    testType: [
      "Blood Test",
      "Urine Test",
      "Tissue Analysis",
      "Microscopy",
      "Culture Test"
    ].includes(initialFormData?.testType || "")
      ? initialFormData?.testType || ""
      : initialFormData?.testType === "other"
        ? "other"
        : ([
            "Blood Test",
            "Urine Test",
            "Tissue Analysis",
            "Microscopy",
            "Culture Test"
          ].includes(initialFormData?.testType || "")
            ? initialFormData?.testType || ""
            : initialFormData?.testType || ""
          ),
    content: initialFormData?.content || "",
    isAiGenerated: initialFormData?.isAiGenerated || false,
    customTestType: initialFormData?.testType && ![
      "Blood Test",
      "Urine Test",
      "Tissue Analysis",
      "Microscopy",
      "Culture Test"
    ].includes(initialFormData?.testType || "")
      ? initialFormData?.testType
      : "",
  });
  const [reportContent, setReportContent] = useState<ReportContent>(initialReportContent || { text: "", tables: [] });

  // Get selected patient and sample data for preview
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const selectedSample = samples.find((s) => s.id === selectedSampleId);
  let selectedSampleWithDoctorName = selectedSample;
  if (selectedSample && profiles) {
    const doctor = profiles.find((p) => p.id === selectedSample.createdBy);
    selectedSampleWithDoctorName = {
      ...selectedSample,
      createdByName: doctor ? `${doctor.firstName} ${doctor.lastName}` : selectedSample.createdBy,
    };
  }

  // Fetch samples when patient is selected
  useEffect(() => {
    if (selectedPatientId) {
      const fetchSamples = async () => {
        try {
          const res = await import("@/actions/reports");
          const result = await res.getSamplesByPatientIdAction(selectedPatientId);
          if (result.success && result.data) {
            setSamples(result.data);
            if (!result.data.some((s: any) => s.id === selectedSampleId)) {
              setSelectedSampleId("");
            }
          } else {
            toast.error(result.error || "Failed to fetch samples");
          }
        } catch (error) {
          toast.error("Failed to fetch samples");
        }
      };
      fetchSamples();
    } else {
      setSamples([]);
      setSelectedSampleId("");
    }
  }, [selectedPatientId]);

  // On mount, fetch samples for the initial patient (edit mode)
  useEffect(() => {
    if (initialPatientId) {
      const fetchSamples = async () => {
        try {
          const res = await import("@/actions/reports");
          const result = await res.getSamplesByPatientIdAction(initialPatientId);
          if (result.success && result.data) {
            setSamples(result.data);
          }
        } catch {}
      };
      fetchSamples();
    }
  }, [initialPatientId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTableAdd = (tableData: TableData) => {
    setReportContent((prev) => ({ ...prev, tables: [...prev.tables, tableData] }));
  };

  const handleTableRemove = (tableId: string) => {
    setReportContent((prev) => ({ ...prev, tables: prev.tables.filter((table) => table.id !== tableId) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedPatientId ||
      !selectedSampleId ||
      !formData.title ||
      !formData.testType ||
      (!formData.content && reportContent.tables.length === 0) ||
      (formData.testType === "other" && !formData.customTestType)
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsLoading(true);
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
      };
      if (mode === "create") {
        submitData.patientId = selectedPatientId;
        submitData.sampleId = selectedSampleId;
        submitData.generatedBy = currentUserId;
      }
      const result = await onSubmit(mode === "edit" && reportId ? [reportId, submitData] : submitData);
      if (result.success) {
        toast.success(mode === "edit" ? "Report updated successfully" : "Report created successfully");
        router.push("/reports");
      } else {
        toast.error(result.error || (mode === "edit" ? "Failed to update report" : "Failed to create report"));
      }
    } catch (error) {
      toast.error(mode === "edit" ? "Failed to update report" : "Failed to create report");
    } finally {
      setIsLoading(false);
    }
  };

  const currentUserProfile = profiles.find((p) => p.userId === currentUserId);
  const doctorName = currentUserProfile ? `${currentUserProfile.firstName} ${currentUserProfile.lastName}` : "N/A";
  const doctorRole = role;
  const doctorLicense = currentUserProfile && currentUserProfile.licenseNo ? currentUserProfile.licenseNo : "N/A";

  // Deduplicate samples by sample.id for dropdown
  const uniqueSamples = [];
  const seenSampleIds = new Set();
  for (const s of samples) {
    if (!seenSampleIds.has(s.id)) {
      uniqueSamples.push(s);
      seenSampleIds.add(s.id);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="patient">Patient *</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} ({patient.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sample">Sample *</Label>
              <Select
                value={selectedSampleId}
                onValueChange={setSelectedSampleId}
                disabled={!selectedPatientId || samples.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!selectedPatientId ? "Select a patient first" : samples.length === 0 ? "No samples available" : "Select a sample"} />
                </SelectTrigger>
                <SelectContent>
                  {uniqueSamples.map((sample) => (
                    <SelectItem key={sample.id} value={sample.id}>
                      {sample.sampleName || `Sample ${sample.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Report Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter report title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testType">Test Type *</Label>
              <Select value={formData.testType} onValueChange={(value) => handleInputChange("testType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Blood Test">Blood Test</SelectItem>
                  <SelectItem value="Urine Test">Urine Test</SelectItem>
                  <SelectItem value="Tissue Analysis">Tissue Analysis</SelectItem>
                  <SelectItem value="Microscopy">Microscopy</SelectItem>
                  <SelectItem value="Culture Test">Culture Test</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {formData.testType === "other" && (
                <Input
                  id="customTestType"
                  value={formData.customTestType}
                  onChange={e => handleInputChange("customTestType", e.target.value)}
                  placeholder="Please specify the test type"
                  required
                  className="mt-2"
                />
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Report Content *</Label>
              {reportContent.tables.length > 0 && (
                <div className="space-y-4">
                  <Label>Added Tables</Label>
                  {reportContent.tables.map((table) => (
                    <div key={table.id} className="relative">
                      <Button
                        onClick={() => handleTableRemove(table.id)}
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2 z-10 text-red-500 hover:text-red-700"
                        type="button"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <TableDisplay tableData={table} />
                    </div>
                  ))}
                </div>
              )}
              <TableEditor onTableAdd={handleTableAdd} />
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                placeholder="Enter detailed report content..."
                rows={6}
                required
              />
            </div>
          </div>
          {selectedSampleId && samples.filter(s => s.id === selectedSampleId && s.imageUrl).length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <Label className="text-sm font-medium">Sample Image Preview</Label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {samples.filter(s => s.id === selectedSampleId && s.imageUrl).map((img, idx) => (
                    <img
                      key={img.imageId || idx}
                      src={img.imageUrl || ''}
                      alt={`Sample preview ${idx + 1}`}
                      className="max-w-xs rounded-lg border"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/reports")}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "edit" ? "Update Report" : "Create Report"}
            </Button>
          </div>
        </form>
      </div>
      <ReportPreview
        formData={formData}
        reportContent={reportContent}
        selectedPatient={selectedPatient}
        selectedSample={selectedSampleWithDoctorName}
        doctorName={doctorName}
        doctorRole={doctorRole}
        doctorLicense={doctorLicense}
      />
    </div>
  );
} 