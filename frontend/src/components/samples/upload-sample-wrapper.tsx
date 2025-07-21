import { getAllPatientsForUser, getProfileByUserId, getRoleById } from "@/db/queries/select";
import { getUser } from "@/lib/auth";
import { ImageUp } from "lucide-react";
import { Button } from "../ui/button";
import SampleDrawer from "./upload-sample-drawer";

export default async function UploadSampleWrapper() {
  const user = await getUser();
  const profile = await getProfileByUserId(user.id);
  const role = await getRoleById(profile.roleId);
  const patients = await getAllPatientsForUser(profile.id, role.name);
  return <SampleDrawer patients={patients}>
    <Button 
      className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground w-full justify-start rounded-lg shadow-sm"
    >
      <ImageUp />
      Upload sample
    </Button>
  </SampleDrawer>;
}