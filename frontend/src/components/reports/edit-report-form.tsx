'use client';
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { TableEditor, TableDisplay } from "@/components/reports/table-editor";
import ReportPreview from "@/components/reports/report-preview";
import { updateReport } from "@/actions/reports";

export default function EditReportForm({
  patients,
  currentUserId,
  profiles,
  role,
  initialFormData,
  initialReportContent,
  selectedPatientId: initialPatientId,
  selectedSampleId: initialSampleId,
  reportId,
}: any) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId);
  const [samples, setSamples] = useState<any[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState(initialSampleId);
  const [formData, setFormData] = useState(initialFormData);
  const [reportContent, setReportContent] = useState(initialReportContent);

  // Get selected patient and sample data for preview
  const selectedPatient = patients.find((p: any) => p.id === selectedPatientId);
  const selectedSample = samples.find((s: any) => s.id === selectedSampleId);
  let selectedSampleWithDoctorName = selectedSample;
  if (selectedSample && profiles) {
    const doctor = profiles.find((p: any) => p.id === selectedSample.createdBy);
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
            // If the current selected sample is not in the new list, reset
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

  // On mount, fetch samples for the initial patient
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

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedSampleId || !formData.title || !formData.testType || (!formData.content && reportContent.tables.length === 0)) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsLoading(true);
    try {
      const result = await updateReport(reportId, {
        title: formData.title,
        content: {
          text: formData.content,
          tables: reportContent.tables,
        },
        testType: formData.testType,
        status: "Draft",
      });
      if (result.success) {
        toast.success("Report updated successfully");
        router.push("/reports");
      } else {
        toast.error(result.error || "Failed to update report");
      }
    } catch (error) {
      toast.error("Failed to update report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };
  const handleTableAdd = (tableData: any) => {
    setReportContent((prev: any) => ({ ...prev, tables: [...prev.tables, tableData] }));
  };
  const handleTableRemove = (tableId: string) => {
    setReportContent((prev: any) => ({ ...prev, tables: prev.tables.filter((table: any) => table.id !== tableId) }));
  };

  const currentUserProfile = profiles.find((p: any) => p.userId === currentUserId);
  const doctorName = currentUserProfile ? `${currentUserProfile.firstName} ${currentUserProfile.lastName}` : "N/A";
  const doctorRole = role;
  const doctorLicense = currentUserProfile && currentUserProfile.licenseNo ? currentUserProfile.licenseNo : "N/A";

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
                  {patients.map((patient: any) => (
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
                  {samples.map((sample: any) => (
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Report Content *</Label>
              {reportContent.tables.length > 0 && (
                <div className="space-y-4">
                  <Label>Added Tables</Label>
                  {reportContent.tables.map((table: any) => (
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
              Update Report
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