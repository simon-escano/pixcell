"use client";

import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import { getPatientInitials } from '../patients/patient-search-combobox';
import { MetaPatient } from '@/app/organizations/[organizationId]/samples/types';

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
  createdByName?: string; // Add this line to match report-preview
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

interface Role {
  id: string;
  name: string;
}

interface Organization {
  id: string;
  name: string | null;
  address: string | null;
  image_url: string | null;
}

interface PDFExportProps {
  formData: {
    title: string;
    testType: string;
    content: string;
    isAiGenerated: boolean;
    customTestType?: string;
  };
  reportContent: ReportContent;
  selectedPatient: MetaPatient | undefined;
  selectedSample: Sample | undefined;
  doctorName: string;
  doctorRole: Role;
  doctorLicense: string;
  organization?: Organization | null;
  baseUrl?: string;
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontSize: 12,
    // fontFamily: 'DejaVuSans', // Remove custom font
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
    // fontFamily: 'DejaVuSans',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
    // fontFamily: 'DejaVuSans',
  },
  contactInfo: {
    marginTop: 4,
    // fontFamily: 'DejaVuSans',
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
    // fontFamily: 'DejaVuSans',
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
    // fontFamily: 'DejaVuSans',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    // fontFamily: 'DejaVuSans',
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
    // fontFamily: 'DejaVuSans',
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
    // fontFamily: 'DejaVuSans',
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
    // fontFamily: 'DejaVuSans',
  },
  value: {
    color: '#1f2937',
    marginBottom: 8,
    // fontFamily: 'DejaVuSans',
  },
  content: {
    lineHeight: 1.6,
    color: '#1f2937',
    // fontFamily: 'DejaVuSans',
  },
  footer: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: 20,
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
    color: '#6b7280',
    // fontFamily: 'DejaVuSans',
  },
});

const getTestTypeDisplayName = (testType: string, customTestType?: string) => {
  if (testType === "other" && customTestType) return customTestType;
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

const ReportPDF = ({ formData, reportContent, selectedPatient, selectedSample, doctorName, doctorRole, doctorLicense, organization, baseUrl = 'http://localhost:3000' }: PDFExportProps) => {
  const pixcellLogoUrl = `${baseUrl}/pixcell-logo.png`;
  
  // --- Pagination logic ---
  // Each paragraph = 1 block, each table = 3 blocks, 9 blocks per page
  const BLOCKS_PER_PAGE = 2;
  const TABLE_BLOCK_SIZE = 3;
  // Split text into paragraphs (empty lines or \n\n)
  const text = formData.content || "";
  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);
  // Interleave paragraphs and tables in order (tables first, then text)
  const tables = reportContent.tables || [];
  const blocks: Array<{ type: 'text'; value: string } | { type: 'table'; value: TableData }> = [
    ...tables.map(t => ({ type: 'table' as const, value: t })),
    ...paragraphs.map(p => ({ type: 'text' as const, value: p })),
  ];
  // Paginate blocks
  const pages: Array<Array<typeof blocks[0]>> = [];
  let currentPage: Array<typeof blocks[0]> = [];
  let currentBlockCount = 0;
  for (const block of blocks) {
    const blockSize = block.type === 'text' ? 1 : TABLE_BLOCK_SIZE;
    if (currentBlockCount + blockSize > BLOCKS_PER_PAGE) {
      if (currentPage.length > 0) pages.push(currentPage);
      currentPage = [];
      currentBlockCount = 0;
    }
    currentPage.push(block);
    currentBlockCount += blockSize;
  }
  if (currentPage.length > 0) pages.push(currentPage);
  const totalPages = Math.max(1, pages.length);
  // --- Render pages ---
  return (
    <Document>
      {pages.map((pageContent, pageIdx) => (
        <Page key={pageIdx} size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.header} fixed>
            <View style={styles.headerContent}>
              <View style={styles.logoSection}>
                {/* Show both PixCell logo and organization logo */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 50, height: 50, padding: 5 }}>
                    <Image src={pixcellLogoUrl} style={{ width: 40, height: 40 }} />
                  </View>
                  {organization?.image_url && (
                    <View style={{ width: 50, height: 50, padding: 5 }}>
                      <Image src={organization.image_url} style={{ width: 40, height: 40 }} />
                    </View>
                  )}
                </View>
                
                <View style={styles.companyInfo}>
                  <Text style={styles.companyName}>{organization?.name || "PixCell"}</Text>
                  {organization?.address && <Text>{organization.address}</Text>}
                  {!organization?.address && <Text>123 Medical Center Dr.</Text>}
                  <View style={styles.contactInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                      <Text>+1 (555) 123-4567</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text>admin@pixcell.com</Text>
                    </View>
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
                    {getPatientInitials(selectedPatient)}
                  </Text>
                ) : (
                  <Text style={styles.patientInitials}>👤</Text>
                )}
              </View>
            </View>
            {pageIdx === 0 && (
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.title}>
                    {formData.title || "Medical Report"}
                  </Text>
                  <Text style={styles.subtitle}>
                    {getTestTypeDisplayName(formData.testType, formData.customTestType) || "Test Type"}
                  </Text>
                </View>
                <View style={styles.dateInfo}>
                  <Text>Date: {formatDate(new Date())}</Text>
                  <Text>Report ID: {selectedSample ? selectedSample.id.slice(0, 8).toUpperCase() : "N/A"}</Text>
                </View>
              </View>
            )}
            {/* Patient and Sample Information only on first page */}
            {pageIdx === 0 && (
              <View style={{ marginTop: 8, marginBottom: 8 }}>
                {/* Patient Information */}
                {selectedPatient && (
                  <>
                    <Text style={styles.sectionTitle}>Patient Information</Text>
                    <View style={styles.sectionContent}>
                      <View style={styles.infoRow}>
                        <Text style={styles.label}>Patient Name:</Text>
                        <Text style={styles.value}>
                          {selectedPatient.fullName || `${selectedPatient.firstName || ''} ${selectedPatient.lastName || ''}`.trim() || "N/A"}
                        </Text>
                      </View>
                      {selectedPatient.email && (
                        <View style={styles.infoRow}>
                          <Text style={styles.label}>Email:</Text>
                          <Text style={styles.value}>{selectedPatient.email}</Text>
                        </View>
                      )}
                      {selectedPatient.contactNumber && (
                        <View style={styles.infoRow}>
                          <Text style={styles.label}>Contact:</Text>
                          <Text style={styles.value}>{selectedPatient.contactNumber}</Text>
                        </View>
                      )}
                    </View>
                  </>
                )}
                {/* Sample Information */}
                {selectedSample && (
                  <>
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
                    <Text style={styles.label}>Created By:</Text>
                    <Text style={styles.value}>{(selectedSample.createdByName || selectedSample.createdBy)}</Text>
                  </View>
                  {selectedSample.capturedAt && (
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Captured:</Text>
                      <Text style={styles.value}>{formatDate(new Date(selectedSample.capturedAt))}</Text>
                    </View>
                  )}
                </View>
                  </>
                )}
              </View>
            )}
          </View>
          {/* Main Content: mixed text and tables */}
          <View style={{ marginBottom: 24, flex: 1 }}>
            {pageContent.map((block, idx) =>
              block.type === 'text' ? (
                <View key={idx} style={{ marginBottom: 12 }}>
                  <Text style={styles.content}>{block.value}</Text>
                </View>
              ) : (
                <View key={idx} style={{ marginBottom: 16 }}>
                  <Text style={styles.sectionTitle}>{block.value.title}</Text>
                  <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                    <View style={{ flexDirection: 'row', backgroundColor: '#f3f4f6' }}>
                      {block.value.headers.map((header, i) => (
                        <View key={i} style={{ flex: 1, padding: 6, borderRightWidth: i < block.value.headers.length - 1 ? 1 : 0, borderColor: '#e5e7eb' }}>
                          <Text style={{ fontWeight: 'bold', color: '#374151' }}>{header}</Text>
                        </View>
                      ))}
                    </View>
                    {block.value.rows.map((row, rowIdx) => (
                      <View key={rowIdx} style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#e5e7eb' }}>
                        {row.map((cell, colIdx) => (
                          <View key={colIdx} style={{ flex: 1, padding: 6, borderRightWidth: colIdx < row.length - 1 ? 1 : 0, borderColor: '#e5e7eb' }}>
                            <Text style={{ color: '#1f2937' }}>{cell}</Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                </View>
              )
            )}
          </View>
          {/* Footer: always present, doctor signatory only on last page */}
          {pageIdx === totalPages - 1 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{doctorName}</Text>
              <Text style={{ textTransform: 'uppercase' }}>{doctorRole.name}</Text>
              <Text>Licence: {doctorLicense}</Text>
            </View>
          )}
          <View style={styles.footer} fixed>
            <View>
              <Text>PID {selectedSample ? selectedSample.id.slice(0, 8).toUpperCase() : "N/A"} | {selectedPatient ? `${selectedPatient.fullName}` : "N/A"}</Text>
              <Text>IMPORTANT NOTICE: For result interpretation, please consult your primary physician.</Text>
            </View>
            <View>
              <Text>Page {pageIdx + 1} of {totalPages}</Text>
              <Text>PixCell System</Text>
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export { ReportPDF };

export const PDFExport = ({ formData, reportContent, selectedPatient, selectedSample, doctorName, doctorRole, doctorLicense, organization, baseUrl }: PDFExportProps, content?: string) => {
  const handleExportPDF = async () => {
    try {
      // Get base URL for images
      const currentBaseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
      
      const blob = await pdf(
        <ReportPDF 
          formData={formData}
          reportContent={reportContent}
          selectedPatient={selectedPatient}
          selectedSample={selectedSample}
          doctorName={doctorName}
          doctorRole={doctorRole}
          doctorLicense={doctorLicense}
          organization={organization}
          baseUrl={currentBaseUrl}
        />
      ).toBlob();
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
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      {content ? <span>{content}</span> : ""}
    </Button>
  );
}; 