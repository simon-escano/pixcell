"use client";

import LiveblocksWrapper from "@/components/samples/liveblocks-wrapper";
import { SamplePage } from "./sample-page";
import { SampleWithImage, PatientWithImage, ProfileWithImage } from "@/db/schema";

interface SamplePageWrapperProps {
  sample: SampleWithImage;
  patient: PatientWithImage;
  profile: ProfileWithImage;
  roleName: string | null;
  disabled?: boolean;
}

export function SamplePageWrapper({
  sample,
  patient,
  profile,
  roleName,
  disabled = false,
}: SamplePageWrapperProps) {
  const roomName = `sample_${sample.id}`;

  return (
    <LiveblocksWrapper>
      <SamplePage 
        roomName={roomName} 
        sample={sample} 
        patient={patient} 
        profile={profile} 
        roleName={roleName} 
        disabled={disabled}
      />
    </LiveblocksWrapper>
  );
}
