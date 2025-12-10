import { getAllPatientsForUser, getProfileByUserId, getRoleById } from "@/db/queries/select";
import { getUser } from "@/lib/auth";
import { ImageUp } from "lucide-react";
import { Button } from "../ui/button";
import SampleDrawer from "./upload-sample-drawer";
import { getMetaProfileByUserId } from "@/app/organizations/[organizationId]/samples/queries";

interface UploadSampleWrapperProps {
  organizationId: string;
}

export default async function UploadSampleWrapper({organizationId}: UploadSampleWrapperProps) {
  const user = await getUser();
  const profile = await getMetaProfileByUserId(user.id);
  const patientsRaw = await getAllPatientsForUser(profile!.id, profile!.role, organizationId);
  let patients = patientsRaw.map((p: any) => ({
    ...p,
    fullName: `${p.firstName} ${p.lastName}`,
    role: p.role ?? "Patient",
    createdBy: p.createdBy ?? profile?.id ?? "",
  }));

  return <SampleDrawer patients={patients}>
    <Button 
      className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground w-full justify-start rounded-lg shadow-sm"
    >
      <ImageUp />
      Upload sample
    </Button>
  </SampleDrawer>;
}