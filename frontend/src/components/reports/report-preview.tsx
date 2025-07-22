"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PDFExport } from "./pdf-export";
import { FileText, Calendar, Worm, TestTube, Phone, Mail } from "lucide-react";
import { format } from "date-fns";
import type { Role } from "@/db/schema";
import { pdf } from '@react-pdf/renderer';
import { ReportPDF } from './pdf-export';
import { MetaPatient } from "@/app/samples/types";
import { get } from "http";
import { getPatientInitials } from "../patients/patient-search-combobox";

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
  createdByName?: string;
}

interface ReportPreviewProps {
  formData: {
    title: string;
    testType: string;
    content: string;
    isAiGenerated: boolean;
    customTestType?: string;
  };
  reportContent: ReportContent;
  selectedPatient?: MetaPatient;
  selectedSample?: Sample;
  doctorName: string;
  doctorRole: Role;
  doctorLicense: string;
}

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

export default function ReportPreview({
  formData,
  reportContent,
  selectedPatient,
  selectedSample,
  doctorName,
  doctorRole,
  doctorLicense,
}: ReportPreviewProps) {
  // --- Pagination logic ---
  // Constants for A4 at 72dpi: 794x1123px
  const PAGE_WIDTH = 794;
  const PAGE_HEIGHT = 1123;
  // --- Improved block-based pagination ---
  // Each paragraph = 1 block, each table = 4 blocks, 8 blocks per page
  const BLOCKS_PER_PAGE = 2;
  const TABLE_BLOCK_SIZE = 3;
  // Split text into paragraphs (empty lines or \n\n)
  const text = formData.content || "";
  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);
  // Interleave paragraphs and tables in order
  const tables = reportContent.tables || [];
  // For this version, put all tables first, then all text
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
      // Start new page
      if (currentPage.length > 0) pages.push(currentPage);
      currentPage = [];
      currentBlockCount = 0;
    }
    currentPage.push(block);
    currentBlockCount += blockSize;
  }
  if (currentPage.length > 0) pages.push(currentPage);
  const totalPages = Math.max(1, pages.length);
  // --- Navigation state ---
  const [pageIdx, setPageIdx] = useState(0);
  useEffect(() => { setPageIdx(0); }, [formData.content, reportContent.tables]);
  // --- Header/Footer components ---
  const reportId = selectedSample ? selectedSample.id.slice(0, 8).toUpperCase() : "N/A";
  const patientName = selectedPatient ? `${selectedPatient.fullName}` : "N/A";

  const Header = () => (
    <div className="flex items-center justify-between mb-2 pb-2 border-b-2 border-gray-300">
      <div className="flex items-center">
        <div className="flex items-center gap-3 self-center font-medium">
          
        </div>
        <div className="text-sm text-gray-700 ml-4">
          <p className="font-semibold text-lg text-gray-800">PixCell</p>
          <p>123 Medical Center Dr.</p>
          <p className="flex items-center space-x-1">
            <img src="/icons/phone.svg" alt="Phone" className="h-3 w-3 text-gray-500" />
            <span>+1 (555) 123-4567</span>
          </p>
          <p className="flex items-center space-x-1">
            <img src="/icons/mail.svg" alt="Mail" className="h-3 w-3 text-gray-500" />
            <span>admin@pixcell.com</span>
          </p>
        </div>
      </div>
      <div className="w-24 h-24 bg-gray-200 flex items-center justify-center overflow-hidden">
        {selectedPatient && selectedPatient.imageUrl ? (
          <img 
            src={selectedPatient.imageUrl} 
            alt={`${selectedPatient.fullName}`}
            className="w-full h-full object-cover"
          />
        ) : selectedPatient ? (
          <span className="text-gray-600 font-semibold text-lg">
            {getPatientInitials(selectedPatient)}
          </span>
        ) : (
          <span className="text-gray-400">👤</span>
        )}
      </div>
    </div>
  );
  const Footer = ({ page, total }: { page: number; total: number }) => (
    <div className="mt-auto pt-6 border-t border-gray-300 flex justify-between items-center text-sm text-gray-600">
      <div>
        <p>PID <span>{reportId}</span> | <span>{patientName}</span></p>
        <p><span>IMPORTANT NOTICE: </span> For result interpretation, please consult your primary physician.</p>
      </div>
      <div>
        <p>Page {page}/{total}</p>
      </div>
    </div>
  );
  // --- Render current page ---
  const pageContent = pages[pageIdx] || [];
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Report Preview</h3>
        <div className="flex items-center space-x-4">
          <PDFExport 
            formData={formData}
            reportContent={reportContent}
            selectedPatient={selectedPatient}
            selectedSample={selectedSample}
            doctorName={doctorName}
            doctorRole={doctorRole}
            doctorLicense={doctorLicense}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const blob = await pdf(
                <ReportPDF
                  formData={formData}
                  reportContent={reportContent}
                  selectedPatient={selectedPatient}
                  selectedSample={selectedSample}
                  doctorName={doctorName}
                  doctorRole={doctorRole}
                  doctorLicense={doctorLicense}
                />
              ).toBlob();
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
              setTimeout(() => URL.revokeObjectURL(url), 10000);
            }}
            className="flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Preview PDF</span>
          </Button>
        </div>
      </div>
      {/* Navigation Controls */}
      <div className="mb-2 justify-center flex gap-2 items-center">
        <Button size="sm" variant="outline" onClick={() => setPageIdx((p) => Math.max(0, p - 1))} disabled={pageIdx === 0}>Prev</Button>
        <span>Page {pageIdx + 1} of {totalPages}</span>
        <Button size="sm" variant="outline" onClick={() => setPageIdx((p) => Math.min(totalPages - 1, p + 1))} disabled={pageIdx === totalPages - 1}>Next</Button>
      </div>
      {/* A4 Preview */}
      <Card style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', borderRadius: 0, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', transform: 'scale(0.8)', transformOrigin: 'top left' }}>
        <div className="h-full flex flex-col p-12" style={{ fontFamily: "'Arial', sans-serif", fontSize: 16, color: '#222' }}>
          <Header />
          {/* Title/TestType/Date only on first page */}
          {pageIdx === 0 && (
            <div className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {formData.title || "Medical Report"}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {getTestTypeDisplayName(formData.testType, formData.customTestType) || "Test Type"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    {format(new Date(), "MMM dd, yyyy")}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Report ID: {selectedSample ? selectedSample.id.slice(0, 8).toUpperCase() : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Sample Information only on first page */}
          {pageIdx === 0 && selectedSample && (
            <div className="mb-2 p-3 rounded-lg">
              <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                <TestTube className="h-4 w-4 mr-1" />
                Sample Information
              </h2>
              <div className="grid grid-cols-1 gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Sample Name:</span>
                  <span className="text-gray-800">{selectedSample.sampleName || `Sample ${selectedSample.id.slice(0, 8)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Sample ID:</span>
                  <span className="text-gray-800">{selectedSample.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Created By:</span>
                  <span className="text-gray-800">{selectedSample.createdByName}</span>
                </div>
                {selectedSample.capturedAt && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Captured:</span>
                    <span className="text-gray-800">{format(new Date(selectedSample.capturedAt), "MMM dd, yyyy")}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Main Content: mixed text and tables */}
          <div className="mb-6 flex-1 overflow-hidden">
            {pageContent.map((block, idx) =>
              block.type === 'text' ? (
                <div key={idx} className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800 leading-relaxed mb-4">
                  {block.value}
                </div>
              ) : (
                <div key={idx} className="mb-4">
                  <h3 className="text-md font-semibold text-gray-800 mb-2">{block.value.title}</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {block.value.headers.map((header: string, index: number) => (
                            <th key={index} className="px-3 py-2 text-left font-medium text-gray-700 border-b">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {block.value.rows.map((row: string[], rowIndex: number) => (
                          <tr key={rowIndex} className="border-b">
                            {row.map((cell: string, colIndex: number) => (
                              <td key={colIndex} className="px-3 py-2 text-gray-800">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </div>
          {/* Footer: always present, doctor signatory only on last page */}
          {pageIdx === totalPages - 1 && (
            <div className="mb-4">
              <h3 className="font-bold uppercase">{doctorName}</h3>
              <p className="uppercase">{doctorRole.name}</p>
              <p>Licence: {doctorLicense}</p>
            </div>
          )}
          <Footer page={pageIdx + 1} total={totalPages} />
        </div>
      </Card>
    </div>
  );
} 