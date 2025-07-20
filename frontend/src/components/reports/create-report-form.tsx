"use client";

import ReportForm from "./ReportForm";
import { addReport } from "@/actions/reports";
import { Role } from "@/db/schema";

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

export default function CreateReportForm({ patients, currentUserId, profiles, role }: CreateReportFormProps) {
  return (
    <ReportForm
      mode="create"
      onSubmit={addReport}
      patients={patients}
      profiles={profiles}
      role={role}
      currentUserId={currentUserId}
    />
  );
} 