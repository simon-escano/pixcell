import { useEffect, useState } from "react";
import { PatientSearchCombobox } from "@/components/patients/patient-search-combobox";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AssignPatientToDoctor() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [doctorId, setDoctorId] = useState<string>("");

  useEffect(() => {
    async function fetchPatients() {
      const res = await fetch("/api/patients");
      const allPatients = await res.json();
      setPatients(allPatients);
    }
    fetchPatients();
  }, []);

  useEffect(() => {
    async function fetchDoctorId() {
      const supabase = createClientComponentClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch profile to get doctor id (profile id)
        const { data: profile, error } = await supabase
          .from('profile')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (profile) setDoctorId(profile.id);
      }
    }
    fetchDoctorId();
  }, []);

  const handleAssign = async () => {
    if (!selectedPatientId || !doctorId) return;
    setLoading(true);
    try {
      await fetch("/api/patient/doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: selectedPatientId, doctorId }),
      });
      toast.success("Patient assigned to you successfully");
      setSelectedPatientId("");
    } catch {
      toast.error("Failed to assign patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Assign Patient to Yourself</label>
      <PatientSearchCombobox
        patients={patients}
        value={selectedPatientId}
        onChange={setSelectedPatientId}
      />
      <Button onClick={handleAssign} disabled={!selectedPatientId || loading} className="w-full mt-2">
        {loading ? "Assigning..." : "Assign Patient"}
      </Button>
    </div>
  );
} 