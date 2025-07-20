import ReportPreview from '@/components/reports/report-preview';
import { report, patient as patientTable } from '@/db/schema';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Base from '@/components/base';
import { cookies } from 'next/headers';
import React from 'react';
// import { getUser } from '@/lib/auth';

interface PageProps {
  params: { id: string };
}

interface ReportContent {
  text: string;
  tables: any[];
}

export default async function ReportViewPage({ params }: PageProps) {
  console.log('--- [id]/page.tsx: ENTERED PAGE ---', params);
  const { id } = await params;
  // Fetch the report by ID
  console.log('--- [id]/page.tsx: Fetching report by ID ---', id);
  const reportRows = await db.select().from(report).where(eq(report.id, id)).limit(1);
  console.log('--- [id]/page.tsx: Report rows ---', reportRows);
  if (!reportRows.length) {
    console.log('--- [id]/page.tsx: Report not found, calling notFound() ---');
    return notFound();
  }
  const rep = reportRows[0];

  // Dynamically import richer fetchers
  const {
    getSampleById,
    getPatientById,
    getProfileByUserId,
    getRoleById,
  } = await import('@/db/queries/select');

  // Fetch patient (with imageUrl)
  let selectedPatient = rep.patientId ? await getPatientById(rep.patientId) : undefined;
  // Fetch sample (with imageUrl, etc.)
  let selectedSample = rep.sampleId ? await getSampleById(rep.sampleId) : undefined;
  // Fetch doctor profile (createdBy is userId, need profile)
  let doctorProfile = rep.generatedBy ? await getProfileByUserId(rep.generatedBy) : undefined;
  // Fetch doctor role
  let doctorRole = doctorProfile?.roleId ? await getRoleById(doctorProfile.roleId) : undefined;
  // Add doctor name to sample for preview
  if (selectedSample && doctorProfile) {
    (selectedSample as any).createdByName = `${doctorProfile.firstName} ${doctorProfile.lastName}`;
  }

  // Prepare props for ReportPreview
  const formData = {
    title: rep.title || '',
    testType: rep.testType || '',
    content: (rep.content as ReportContent)?.text || '',
    isAiGenerated: rep.isAiGenerated || false,
  };
  const reportContent = (rep.content as ReportContent) || { text: '', tables: [] };
  const doctorName = doctorProfile ? `${doctorProfile.firstName} ${doctorProfile.lastName}` : 'N/A';
  // @ts-ignore: licenseNo may not exist
  const doctorLicense = doctorProfile?.licenseNo || 'N/A';

  console.log('--- [id]/page.tsx: Rendering ReportPreview ---');
  // Always show the report preview, no auth or code prompt
  return (
    <div>
      <ReportPreview
        formData={formData}
        reportContent={reportContent}
        selectedPatient={selectedPatient}
        selectedSample={selectedSample}
        doctorName={doctorName}
        doctorRole={doctorRole || { id: 'unknown', name: 'Doctor' }}
        doctorLicense={doctorLicense}
      />
    </div>
  );
}