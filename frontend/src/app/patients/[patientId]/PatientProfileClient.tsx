"use client";
import dynamic from "next/dynamic";
import ProfilePageLayout from "@/components/profile/ProfilePageLayout";
import React from "react";
import { Button } from "@/components/ui/button";
import { UploadSampleDrawerForPatient } from "@/components/samples/upload-sample-drawer";

const EditPatientDialogTrigger = dynamic(() => import("@/components/patients/edit-patient-dialog-trigger").then(m => m.EditPatientDialogTrigger), { ssr: false });
const PatientReportsList = dynamic(() => import("@/components/patients/patient-reports-list").then(m => m.PatientReportsList), { ssr: false });

export default function PatientProfileClient({
  patient,
  metaPatient,
  samples,
  reports,
  reportCount,
}: {
  patient: any;
  metaPatient: any;
  samples: any[];
  reports: any[];
  reportCount: number;
}) {
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

  // Actions section for patient
  const actions = (
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

  // Report list for patient
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
    />
  );
} 