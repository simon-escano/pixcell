import { getAllPatients } from "@/db/queries/select";
import React from "react";
import UploadSampleDrawer from "./upload-sample-drawer";

export default async function UploadSampleWrapper() {
  const patients = await getAllPatients();
  return <UploadSampleDrawer patients={patients} />;
}
