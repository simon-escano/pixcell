"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addReport, getSamplesByPatientIdAction } from "@/actions/reports";
import toast from "react-hot-toast";
import { Loader2, FileText, Calendar, User, TestTube, Phone, Mail, Worm, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { PDFExport } from "./pdf-export";
import { TableEditor, TableDisplay } from "./table-editor";
import { Role } from "@/db/schema";
import ReportPreview from "./report-preview";

interface Patient {
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

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  userId: string;
  roleId: string;
  imageId?: string;
  licenseNo?: string;
  
}

interface Sample {
  id: string;
  patientId: string;
  sampleName: string | null;
  createdBy: string;
  uploadedBy: string | null;
  metadata: unknown;
  capturedAt: Date | null;
  imageId: string | null;
  imageUrl: string | null;
  createdByName?: string; // Added for doctor's name
}

interface TableData {
  id: string;
  title: string;
  headers: string[];
  rows: string[][];
}

interface ReportContent {
  text: string;
  tables: TableData[];
}

interface CreateReportFormProps {
  patients: Patient[];
  currentUserId: string;
  profiles: Profile[];
  role: Role;
}

export default function CreateReportForm({ patients, currentUserId, profiles, role}: CreateReportFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [samples, setSamples] = useState<Sample[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    testType: "",
    content: "",
    isAiGenerated: false,
  });

  const [reportContent, setReportContent] = useState<ReportContent>({
    text: "",
    tables: [],
  });

  // Get selected patient and sample data for preview
  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const selectedSample = samples.find(s => s.id === selectedSampleId);

  let selectedSampleWithDoctorName = selectedSample;
  if (selectedSample && profiles) {
    const doctor = profiles.find(p => p.id === selectedSample.createdBy);
    selectedSampleWithDoctorName = {
      ...selectedSample,
      createdByName: doctor ? `${doctor.firstName} ${doctor.lastName}` : selectedSample.createdBy
    };
  }

  // Fetch samples when patient is selected
  useEffect(() => {
    if (selectedPatientId) {
      const fetchSamples = async () => {
        try {
          const result = await getSamplesByPatientIdAction(selectedPatientId);
          if (result.success && result.data) {
            setSamples(result.data);
            setSelectedSampleId(""); // Reset sample selection
          } else {
            toast.error(result.error || "Failed to fetch samples");
          }
        } catch (error) {
          console.error("Error fetching samples:", error);
          toast.error("Failed to fetch samples");
        }
      };
      fetchSamples();
    } else {
      setSamples([]);
      setSelectedSampleId("");
    }
  }, [selectedPatientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatientId || !selectedSampleId || !formData.title || !formData.testType || (!formData.content && reportContent.tables.length === 0)) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await addReport({
        title: formData.title,
        content: {
          text: formData.content,
          tables: reportContent.tables,
        },
        testType: formData.testType,
        patientId: selectedPatientId,
        sampleId: selectedSampleId,
        isAiGenerated: formData.isAiGenerated,
        generatedBy: currentUserId,
        status: "Draft", // Use a valid enum value
      });

      if (result.success) {
        toast.success("Report created successfully");
        router.push("/reports");
      } else {
        toast.error(result.error || "Failed to create report");
      }
    } catch (error) {
      console.error("Error creating report:", error);
      toast.error("Failed to create report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTableAdd = (tableData: TableData) => {
    setReportContent(prev => ({
      ...prev,
      tables: [...prev.tables, tableData],
    }));
  };

  const handleTableRemove = (tableId: string) => {
    setReportContent(prev => ({
      ...prev,
      tables: prev.tables.filter(table => table.id !== tableId),
    }));
  };

  const getTestTypeDisplayName = (testType: string) => {
    const testTypes: { [key: string]: string } = {
      blood_test: "Blood Test",
      urine_test: "Urine Test",
      tissue_analysis: "Tissue Analysis",
      microscopy: "Microscopy",
      culture_test: "Culture Test",
      other: "Other"
    };
    return testTypes[testType] || testType;
  };

  const currentUserProfile = profiles.find(p => p.userId === currentUserId);
  const doctorName = currentUserProfile ? `${currentUserProfile.firstName} ${currentUserProfile.lastName}` : "N/A";
  const doctorRole = role
  const doctorLicense = currentUserProfile && currentUserProfile.licenseNo ? currentUserProfile.licenseNo : "N/A";

  const reportId = selectedSample ? selectedSample.id.slice(0, 8).toUpperCase() : "N/A";
  const patientName = selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "N/A";

  const currentPage = 1;
  const totalPages = 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form Section */}
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Selection */}
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

            {/* Sample Selection */}
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
                  {samples.map((sample) => (
                    <SelectItem key={sample.id} value={sample.id}>
                      {sample.sampleName || `Sample ${sample.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Report Title */}
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

            {/* Test Type */}
            <div className="space-y-2">
              <Label htmlFor="testType">Test Type *</Label>
              <Select value={formData.testType} onValueChange={(value) => handleInputChange("testType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blood_test">Blood Test</SelectItem>
                  <SelectItem value="urine_test">Urine Test</SelectItem>
                  <SelectItem value="tissue_analysis">Tissue Analysis</SelectItem>
                  <SelectItem value="microscopy">Microscopy</SelectItem>
                  <SelectItem value="culture_test">Culture Test</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Report Content */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Report Content *</Label>
              {/* Display Added Tables */}
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

            {/* Table Editor */}
           

            
          </div>



          {/* Selected Sample Preview */}
          {selectedSampleId && selectedSampleWithDoctorName?.imageUrl && (
            <Card>
              <CardContent className="pt-6">
                <Label className="text-sm font-medium">Sample Image Preview</Label>
                <div className="mt-2">
                  <img
                    src={selectedSampleWithDoctorName.imageUrl}
                    alt="Sample preview"
                    className="max-w-xs rounded-lg border"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
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
              Create Report
            </Button>
          </div>
        </form>
      </div>

      {/* PDF Preview Section */}
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