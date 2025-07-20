"use client";
import { useState, useEffect } from "react";
import { PatientDialog } from "@/components/patients/patient-dialog";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useRouter } from "next/navigation";

export function EditPatientDialogTrigger({ patient }: { patient: any }) {
  const [open, setOpen] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [currentDoctorId, setCurrentDoctorId] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    async function fetchDoctors() {
      const res = await fetch('/api/doctors');
      const allDoctors = await res.json();
      setDoctors(allDoctors);
    }
    fetchDoctors();
  }, []);

  useEffect(() => {
    async function fetchCurrentDoctor() {
      if (open && patient?.id) {
        const res = await fetch(`/api/patient/${patient.id}/doctor`);
        const data = await res.json();
        setCurrentDoctorId(data.doctorId || "");
      }
    }
    fetchCurrentDoctor();
  }, [open, patient?.id]);

  const handleDoctorChange = async (doctorId: string) => {
    if (patient?.id) {
      await fetch('/api/patient/doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: patient.id, doctorId })
      });
    }
    setCurrentDoctorId(doctorId);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-8 w-8 p-0"
        onClick={() => setOpen(true)}
        aria-label="Edit Patient"
      >
        <Edit className="h-3 w-3" />
      </Button>
      <PatientDialog
        open={open}
        setOpen={setOpen}
        mode="edit"
        existingPatient={patient}
        showTrigger={false}
        doctors={doctors}
        currentDoctorId={currentDoctorId}
        onDoctorChange={handleDoctorChange}
      />
    </>
  );
} 