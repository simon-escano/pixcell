"use client";

import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import toast from "react-hot-toast";

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
}

interface PDFExportProps {
  formData: {
    title: string;
    testType: string;
    content: string;
    isAiGenerated: boolean;
  };
  selectedPatient: Patient | undefined;
  selectedSample: Sample | undefined;
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontSize: 12,
    fontFamily: 'Arial',
  },
  header: {
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: 20,
    marginBottom: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 48,
    height: 48,
    backgroundColor: '#6D28D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logoText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  companyInfo: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'Arial',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
    fontFamily: 'Arial',
  },
  contactInfo: {
    marginTop: 4,
    fontFamily: 'Arial',
  },
  patientAvatar: {
    width: 64,
    height: 64,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4b5563',
    fontFamily: 'Arial',
  },
  patientImage: {
    width: 64,
    height: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    fontFamily: 'Arial',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    fontFamily: 'Arial',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateInfo: {
    textAlign: 'right',
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Arial',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    fontFamily: 'Arial',
  },
  sectionContent: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
    marginRight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
    fontFamily: 'Arial',
  },
  value: {
    color: '#1f2937',
    marginBottom: 8,
    fontFamily: 'Arial',
  },
  content: {
    lineHeight: 1.6,
    color: '#1f2937',
    fontFamily: 'Arial',
  },
  footer: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: 20,
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
    color: '#6b7280',
    fontFamily: 'Arial',
  },
});

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

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatDateTime = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ReportPDF = ({ formData, selectedPatient, selectedSample }: PDFExportProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoSection}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>🧬</Text>
            </View>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>PixCell</Text>
              <Text>123 Medical Center Dr.</Text>
              <View style={styles.contactInfo}>
                <Text>📞 +1 (555) 123-4567</Text>
                <Text>✉️ admin@pixcell.com</Text>
              </View>
            </View>
          </View>
          <View style={styles.patientAvatar}>
            {selectedPatient && selectedPatient.imageUrl ? (
              <Image 
                src={selectedPatient.imageUrl} 
                style={styles.patientImage}
              />
            ) : selectedPatient ? (
              <Text style={styles.patientInitials}>
                {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
              </Text>
            ) : (
              <Text style={styles.patientInitials}>👤</Text>
            )}
          </View>
        </View>


        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>
              {formData.title || "Medical Report"}
            </Text>
            <Text style={styles.subtitle}>
              {getTestTypeDisplayName(formData.testType) || "Test Type"}
            </Text>
          </View>
          <View style={styles.dateInfo}>
            <Text>Date: {formatDate(new Date())}</Text>
            <Text>Report ID: {selectedSample ? selectedSample.id.slice(0, 8).toUpperCase() : "N/A"}</Text>
          </View>
        </View>
        
      </View>

      {/* Patient and Sample Information */}
      <View style={styles.section}>
        <View style={styles.infoGrid}>
          {/* Patient Information */}
          {selectedPatient && (
            <View style={styles.infoItem}>
              <Text style={styles.sectionTitle}>Patient Information</Text>
              <View style={styles.sectionContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Name:</Text>
                  <Text style={styles.value}>{selectedPatient.firstName} {selectedPatient.lastName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Email:</Text>
                  <Text style={styles.value}>{selectedPatient.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Phone:</Text>
                  <Text style={styles.value}>{selectedPatient.contactNumber}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Address:</Text>
                  <Text style={styles.value}>{selectedPatient.address}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Sex:</Text>
                  <Text style={styles.value}>{selectedPatient.sex}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Blood Type:</Text>
                  <Text style={styles.value}>{selectedPatient.bloodType}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Height:</Text>
                  <Text style={styles.value}>{selectedPatient.height} cm</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Weight:</Text>
                  <Text style={styles.value}>{selectedPatient.weight} kg</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Birth Date:</Text>
                  <Text style={styles.value}>{formatDate(new Date(selectedPatient.birthDate))}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Sample Information */}
          {selectedSample && (
            <View style={styles.infoItem}>
              <Text style={styles.sectionTitle}>Sample Information</Text>
              <View style={styles.sectionContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Sample Name:</Text>
                  <Text style={styles.value}>{selectedSample.sampleName || `Sample ${selectedSample.id.slice(0, 8)}`}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Sample ID:</Text>
                  <Text style={styles.value}>{selectedSample.id.slice(0, 8).toUpperCase()}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Patient ID:</Text>
                  <Text style={styles.value}>{selectedSample.patientId.slice(0, 8).toUpperCase()}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Created By:</Text>
                  <Text style={styles.value}>{selectedSample.createdBy.slice(0, 8).toUpperCase()}</Text>
                </View>
                {selectedSample.capturedAt && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Captured:</Text>
                    <Text style={styles.value}>{formatDate(new Date(selectedSample.capturedAt))}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Report Content */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Report Content</Text>
        <Text style={styles.content}>
          {formData.content || "No content provided."}
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text>Generated by: {formData.isAiGenerated ? "AI Assistant" : "Medical Staff"}</Text>
          <Text>Date: {formatDateTime(new Date())}</Text>
        </View>
        <View>
          <Text>Page 1 of 1</Text>
          <Text>PixCell Medical System</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export const PDFExport = ({ formData, selectedPatient, selectedSample }: PDFExportProps) => {
  const handleExportPDF = async () => {
    try {
      const blob = await pdf(<ReportPDF formData={formData} selectedPatient={selectedPatient} selectedSample={selectedSample} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${formData.title || 'medical-report'}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  return (
    <Button 
      onClick={handleExportPDF}
      variant="outline"
      size="sm"
      className="flex items-center space-x-2"
    >
      <Download className="h-4 w-4" />
      <span>Export PDF</span>
    </Button>
  );
}; 