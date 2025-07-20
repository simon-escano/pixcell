import ReportPreview from "@/components/reports/report-preview";

export default async function ReportViewByCodePage({ params }: { params: { code: string } }) {
  const code = params.code;

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL
      ? process.env.NEXT_PUBLIC_BASE_URL
      : "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/reports/by-code?code=${encodeURIComponent(code)}`, { cache: "no-store" });
  if (!res.ok) {
    return <div className="text-red-600 p-8">Report not found.</div>;
  }
  const reportData = await res.json();

  return (
    <div className="max-w-4xl mx-auto p-8">
      <ReportPreview
        formData={reportData.formData}
        reportContent={reportData.reportContent}
        selectedPatient={reportData.selectedPatient}
        selectedSample={reportData.selectedSample}
        doctorName={reportData.doctorName}
        doctorRole={reportData.doctorRole}
        doctorLicense={reportData.doctorLicense}
      />
    </div>
  );
}
