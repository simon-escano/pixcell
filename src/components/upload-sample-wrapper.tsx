import { getPatients } from "@/db/queries/select";
import React from "react";
import UploadSampleDrawer from "./upload-sample-drawer";

export default async function UploadSampleWrapper() {
  const patients = await getPatients();
  return <UploadSampleDrawer patients={patients} />;
}
