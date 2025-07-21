import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";

export default function AssignDoctorToPatient({ patientId, onUpdate }: { patientId: string, onUpdate?: () => void }) {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [assignedDoctorIds, setAssignedDoctorIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all doctors
  useEffect(() => {
    async function fetchDoctors() {
      const res = await fetch("/api/doctors");
      const allDoctors = await res.json();
      setDoctors(allDoctors);
    }
    fetchDoctors();
  }, []);

  // Fetch assigned doctors for this patient
  useEffect(() => {
    async function fetchAssignedDoctors() {
      if (patientId) {
        const res = await fetch(`/api/patients/${patientId}/doctors`);
        const data = await res.json();
        setAssignedDoctorIds(data.map((doc: any) => doc.id));
      }
    }
    fetchAssignedDoctors();
  }, [patientId]);

  const handleToggle = async (doctorId: string, checked: boolean) => {
    setLoading(true);
    try {
      if (checked) {
        // Assign doctor
        await fetch(`/api/patients/${patientId}/doctors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ doctorId }),
        });
        setAssignedDoctorIds((prev) => [...prev, doctorId]);
        toast.success("Doctor assigned successfully");
      } else {
        // Remove doctor
        await fetch(`/api/patients/${patientId}/doctors?doctorId=${doctorId}`, {
          method: "DELETE",
        });
        setAssignedDoctorIds((prev) => prev.filter((id) => id !== doctorId));
        toast.success("Doctor removed successfully");
      }
      if (onUpdate) onUpdate();
    } catch {
      toast.error("Failed to update doctor assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Assign Doctors</label>
      <div className="flex flex-col gap-2">
        {doctors.map((doc: any) => (
          <label key={doc.id} className="flex items-center gap-2">
            <Checkbox
              checked={assignedDoctorIds.includes(doc.id)}
              onCheckedChange={(checked) => handleToggle(doc.id, !!checked)}
              disabled={loading}
            />
            {doc.firstName} {doc.lastName}
          </label>
        ))}
      </div>
      {loading && <div className="text-xs text-muted-foreground">Updating...</div>}
    </div>
  );
} 