"use client";
import React, { useState } from "react";
import ReportPreview from '@/components/reports/report-preview';

interface ReportContent {
  text: string;
  tables: any[];
}

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
  createdByName?: string;
}

interface Role {
  id: string;
  name: string;
}

interface Props {
  correctCode: string;
  formData: {
    title: string;
    testType: string;
    content: string;
    isAiGenerated: boolean;
  };
  reportContent: ReportContent;
  selectedPatient?: Patient;
  selectedSample?: Sample;
  doctorName: string;
  doctorRole: Role;
  doctorLicense: string;
}

export default function ReportViewClient(props: Props) {
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim() === props.correctCode) {
      setUnlocked(true);
      setError("");
    } else {
      setError("Invalid code. Please try again.");
    }
  };

  if (unlocked) {
    return (
      <ReportPreview
        formData={props.formData}
        reportContent={props.reportContent}
        selectedPatient={props.selectedPatient}
        selectedSample={props.selectedSample}
        doctorName={props.doctorName}
        doctorRole={props.doctorRole}
        doctorLicense={props.doctorLicense}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-12 p-6 border rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Enter Report Code</h2>
      <input
        className="border px-3 py-2 rounded w-full mb-2"
        value={inputCode}
        onChange={e => setInputCode(e.target.value)}
        placeholder="Enter code"
        required
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">View Report</button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </form>
  );
} 