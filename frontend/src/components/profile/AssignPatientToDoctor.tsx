import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AssignPatientToDoctor({ doctorId: propDoctorId }: { doctorId?: string }) {
  const [patients, setPatients] = useState<any[]>([]);
  const [assignedPatientIds, setAssignedPatientIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [doctorId, setDoctorId] = useState<string>("");

  useEffect(() => {
    async function fetchDoctorIdAndPatients() {
      let useDoctorId = propDoctorId;
      if (!useDoctorId) {
        const supabase = createClientComponentClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch profile to get doctor id (profile id)
          const { data: profile } = await supabase
            .from('profile')
            .select('id')
            .eq('user_id', user.id)
            .single();
          if (profile) {
            useDoctorId = profile.id;
          }
        }
      }
      if (useDoctorId) {
        setDoctorId(useDoctorId);
        // Fetch all patients and assigned patient IDs for this doctor
        const res = await fetch(`/api/doctors/${useDoctorId}/patients`);
        if (res.ok) {
          const { allPatients, assignedPatientIds } = await res.json();
          setPatients(allPatients);
          setAssignedPatientIds(assignedPatientIds);
        }
      }
    }
    fetchDoctorIdAndPatients();
  }, [propDoctorId]);

  const handleToggle = async (patientId: string, checked: boolean) => {
    if (!doctorId) return;
    setLoading(true);
    try {
      if (checked) {
        // Assign patient to doctor
        await fetch(`/api/doctors/${doctorId}/patients`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId }),
        });
        setAssignedPatientIds((prev) => [...prev, patientId]);
        toast.success("Patient assigned successfully");
      } else {
        // Remove patient from doctor
        await fetch(`/api/doctors/${doctorId}/patients?patientId=${patientId}`, {
          method: "DELETE",
        });
        setAssignedPatientIds((prev) => prev.filter((id) => id !== patientId));
        toast.success("Patient unassigned successfully");
      }
    } catch {
      toast.error("Failed to update patient assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Assign Patients to This Doctor</label>
      <div className="flex flex-col gap-2">
        {patients.map((patient: any) => (
          <label key={patient.id} className="flex items-center gap-2">
            <Checkbox
              checked={assignedPatientIds.includes(patient.id)}
              onCheckedChange={(checked) => handleToggle(patient.id, !!checked)}
              disabled={loading}
            />
            {patient.firstName} {patient.lastName} <span className="text-xs text-muted-foreground">({patient.email})</span>
          </label>
        ))}
      </div>
      {loading && <div className="text-xs text-muted-foreground">Updating...</div>}
    </div>
  );
} 