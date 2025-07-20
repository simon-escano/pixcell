"use client";
import { Button } from "@/components/ui/button";
import { UploadSampleDrawerForPatient } from "@/components/samples/upload-sample-drawer";
import { useRouter } from "next/navigation";

export function PatientActionRow({ patientId, patientName }: { patientId: string, patientName: string }) {
  const router = useRouter();

  return (
    <div className="mt-4 flex flex-row items-center gap-2">
      <UploadSampleDrawerForPatient patientId={patientId} className="w-auto" />
      <Button
        variant="secondary"
        onClick={() => router.push(`/reports?search=${encodeURIComponent(patientName)}`)}
      >
        View Reports
      </Button>
    </div>
  );
} 