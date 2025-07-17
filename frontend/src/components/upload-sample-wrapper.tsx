import { getUser } from "@/lib/auth";
import { getAllPatientsForUser, getProfileByUserId, getRoleById } from "@/db/queries/select";
import React from "react";
import UploadSampleDrawer from "./upload-sample-drawer";

export default async function UploadSampleWrapper() {
  const user = await getUser();
  const profile = await getProfileByUserId(user.id);
  const role = await getRoleById(profile.roleId);
  const patients = await getAllPatientsForUser(profile.id, role.name);
  return <UploadSampleDrawer patients={patients} />;
}
