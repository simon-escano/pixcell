"use client";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";

export function PatientActionRow({ patientId, patientName }: { patientId: string, patientName: string }) {
  const router = useRouter();
  const params = useParams();
  const orgId = (params as any)?.organizationId || "";

  return (
    <div className="mt-4 flex flex-row items-center gap-2">
      <Button
        variant="secondary"
        onClick={() => {
          const q = `?search=${encodeURIComponent(patientName)}`
          if (orgId) router.push(`/organizations/${orgId}/reports${q}`)
          else router.push(`/reports${q}`)
        }}
      >
        View Reports
      </Button>
    </div>
  );
} 