import dynamic from "next/dynamic";
import ProfilePageLayout from "@/components/profile/ProfilePageLayout";
import React, { useEffect, useState, useCallback } from "react";

const PatientReportsList = dynamic(() => import("@/components/patients/patient-reports-list").then(m => m.PatientReportsList), { ssr: false });
const EditUserDialogTrigger = dynamic(() => import("@/components/users/user-dialog-client"), { ssr: false });
const EditPatientDialogTrigger = dynamic(() => import("@/components/patients/edit-patient-dialog-trigger").then(m => m.EditPatientDialogTrigger), { ssr: false });
const UploadSampleDrawerForPatient = dynamic(() => import("@/components/samples/upload-sample-drawer").then(m => m.UploadSampleDrawerForPatient), { ssr: false });
const AssignDoctorToPatient = dynamic(() => import("./AssignDoctorToPatient"), { ssr: false });
const AssignPatientToDoctor = dynamic(() => import("./AssignPatientToDoctor"), { ssr: false });
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type ProfileClientProps =
  | ({
      type: "user";
      user: any;
      profile: any;
      role: string;
      samples: any[];
      reports: any[];
      metaUser: any;
      patients?: any[];
    })
  | ({
      type: "patient";
      patient: any;
      metaPatient: any;
      samples: any[];
      reports: any[];
      reportCount: number;
      // Add doctors prop
      doctors?: any[];
    });

export default function ProfileClient(props: ProfileClientProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<string>("");

  useEffect(() => {
    async function fetchUserAndRole() {
      const supabase = createClientComponentClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const res = await fetch(`/api/profile-with-role?userId=${user.id}`);
        const { profile, role } = await res.json();
        setCurrentUser(profile);
        setCurrentRole(role?.name || "");
      }
    }
    fetchUserAndRole();
  }, []);

  if (props.type === "user") {
    const { user, profile, role, samples, reports, metaUser, patients = [] } = props;
    // Details section for user
    const details = (
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <div>
            <span className="text-muted-foreground">Phone</span>
            <div className="font-medium text-card-foreground">{user.phone || "-"}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Email</span>
            <div className="font-medium text-card-foreground">{user.email}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Role</span>
            <div className="font-medium text-card-foreground">{role}</div>
          </div>
        </div>
      </div>
    );
    // Deduplicate samples by id
    const uniqueSamples = samples.filter((sample, idx, arr) =>
      arr.findIndex(s => s.id === sample.id) === idx
    );
    const reportList = <PatientReportsList reports={reports} />;
    // Patients tab content
    const patientsList = (
      <div className="space-y-2 h-full overflow-auto">
        {patients.length > 0 ? (
          patients.map((patient: any) => (
            <button
              key={patient.id}
              className="p-3 bg-muted rounded-lg w-full text-left hover:bg-muted/80 transition-all"
              onClick={() => window.location.href = `/patients/${patient.id}`}
              type="button"
            >
              <div className="font-medium text-card-foreground text-sm">
                {patient.firstName} {patient.lastName}
              </div>
              <div className="text-xs text-muted-foreground">{patient.email}</div>
            </button>
          ))
        ) : (
          <div className="text-muted-foreground text-center py-8">No patients assigned.</div>
        )}
      </div>
    );
    // Doctor can assign patients to self if viewing own profile
    let actions = undefined;
    if (
      currentUser &&
      currentRole.toLowerCase().includes("doctor") &&
      currentUser.id === user.id
    ) {
      actions = <AssignPatientToDoctor />;
    }
    return (
      <ProfilePageLayout
        entity={{ ...profile, email: user.email }}
        samples={uniqueSamples}
        reports={reports}
        metaEntity={metaUser}
        editDialogTrigger={<EditUserDialogTrigger user={user} profile={profile} role={role} />}
        details={details}
        reportList={reportList}
        patientsList={patients}
        patientsCount={patients.length}
        patients={patients}
        actions={actions}
      />
    );
  } else if (props.type === "patient") {
    const { patient, metaPatient, samples, reports, reportCount } = props;
    // [NEW] State for doctors
    const [doctors, setDoctors] = useState<any[]>([]);
    // [NEW] Stable fetchDoctors function
    const fetchDoctors = useCallback(async () => {
      if (patient?.id) {
        const res = await fetch(`/api/patients/${patient.id}/doctors`);
        if (res.ok) {
          setDoctors(await res.json());
        }
      }
    }, [patient?.id]);
    useEffect(() => {
      fetchDoctors();
    }, [fetchDoctors]);
    // Details section for patient
    const details = (
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <div>
            <span className="text-muted-foreground">Gender</span>
            <div className="font-medium text-card-foreground">{patient.sex || "Male"}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Birthday</span>
            <div className="font-medium text-card-foreground">
              {new Date(patient.birthDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Phone</span>
            <div className="font-medium text-card-foreground">{patient.contactNumber}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Blood Type</span>
            <div className="font-medium text-muted-foreground">{patient.bloodType}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Height</span>
            <div className="font-medium text-card-foreground">{patient.height} cm</div>
          </div>
          <div>
            <span className="text-muted-foreground">Weight</span>
            <div className="font-medium text-card-foreground">{patient.weight} kg</div>
          </div>
        </div>
        <div className="pt-1.5 border-t border-border">
          <span className="text-muted-foreground">Address</span>
          <div className="font-medium text-card-foreground">{patient.address}</div>
        </div>
      </div>
    );
    // Admin can assign doctor to patient
    
    let actions = (
      <div className="space-y-2">
        <UploadSampleDrawerForPatient patientId={patient.id} />
        <form action={`/reports`} method="get">
          <input type="hidden" name="search" value={`${patient.firstName} ${patient.lastName}`} />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="w-full text-sm py-2 text-muted-foreground hover:text-card-foreground bg-transparent"
          >
            View Reports
          </Button>
        </form>
      </div>
    );
    if (currentRole === "Administrator") {
      actions = (
        <>
          <AssignDoctorToPatient patientId={patient.id} onUpdate={fetchDoctors} />
          {actions}
        </>
      );
    }
    const reportList = <PatientReportsList reports={reports} />;
    return (
      <ProfilePageLayout
        entity={{ ...patient, email: patient.email }}
        samples={samples}
        reports={reports}
        metaEntity={metaPatient}
        editDialogTrigger={<EditPatientDialogTrigger patient={patient} />}
        details={details}
        actions={actions}
        reportList={reportList}
        reportCount={reportCount}
        // [NEW] Pass doctors as doctorsList
        doctorsList={doctors}
        doctorsCount={doctors.length}
      />
    );
  }
  return null;
} 