"use client";
import dynamic from "next/dynamic";
import ProfilePageLayout from "@/components/profile/ProfilePageLayout";
import React from "react";

const PatientReportsList = dynamic(() => import("@/components/patients/patient-reports-list").then(m => m.PatientReportsList), { ssr: false });
const EditUserDialogTrigger = dynamic(() => import("@/components/users/user-dialog-client"), { ssr: false });
const SampleCard = dynamic(() => import("@/components/samples/sample-card"), { ssr: false });

type UserProfileClientProps = {
  user: any;
  profile: any;
  role: string;
  samples: any[];
  reports: any[];
  metaUser: any;
};

export default function UserProfileClient({
  user,
  profile,
  role,
  samples,
  reports,
  metaUser,
}: UserProfileClientProps) {
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

  // Sample list for user (if metaUser is available, use SampleCard)
  // Deduplicate samples by id
  const uniqueSamples = samples.filter((sample, idx, arr) =>
    arr.findIndex(s => s.id === sample.id) === idx
  );

  let sampleList = undefined;
  if (metaUser) {
    sampleList = (
      <div className="space-y-2 h-full overflow-auto">
        {uniqueSamples.map((sample) => (
          <SampleCard
            key={sample.id}
            currentUser={metaUser}
            sample={sample}
            sampleImages={sample.sampleImages || []}
          />
        ))}
      </div>
    );
  }

  // Report list for user
  const reportList = <PatientReportsList reports={reports} />;

  return (
    <ProfilePageLayout
      entity={{ ...profile, email: user.email }}
      samples={samples}
      reports={reports}
      metaEntity={metaUser}
      editDialogTrigger={<EditUserDialogTrigger user={user} profile={profile} role={role} />}
      details={details}
      reportList={reportList}
      sampleList={sampleList}
    />
  );
} 