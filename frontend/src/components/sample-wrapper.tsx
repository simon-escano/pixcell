import React from "react";
import {
  getPatientById,
  getProfileByUserId,
  getRoleById,
} from "@/db/queries/select";
import { SampleWithImage, PatientWithImage, ProfileWithImage } from "@/db/schema";
import SampleCard from "./sample-card";

async function SampleWrapper({ sample }: { sample: SampleWithImage }) {
  const patient = await getPatientById(sample.patientId) as PatientWithImage;
  
  // Handle case where sample_image data might not exist
  const profile = sample.uploadedBy 
    ? (await getProfileByUserId(sample.uploadedBy)) as ProfileWithImage
    : null;
  const role = profile ? await getRoleById(profile.roleId) : null;
  
  return (
    <SampleCard
      patient={patient}
      sample={sample}
      profile={profile}
      role={role}
    />
  );
}

export default SampleWrapper;
