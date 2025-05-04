import React from "react";
import {
  getPatientById,
  getProfileByUserId,
  getRoleById,
} from "@/db/queries/select";
import { Sample } from "@/db/schema";
import SampleCard from "./sample-card";

async function SampleWrapper({ sample }: { sample: Sample }) {
  const patient = await getPatientById(sample.patientId);
  const profile = await getProfileByUserId(sample.uploadedBy);
  const role = await getRoleById(profile.roleId);
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
