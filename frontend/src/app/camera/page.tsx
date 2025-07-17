import Base from "@/components/base";
import CameraClient from "./camera-client";
import { getProfileByUserId, getRoleById, getAllPatientsForUser } from "@/db/queries/select";
import { getUser } from "@/lib/auth";

export default async function CameraPage() {
  const user = await getUser();
  const profile = await getProfileByUserId(user.id);
  const role = await getRoleById(profile.roleId);
  const patients = await getAllPatientsForUser(user.id, role.id); // or role, depending on function signature
  
  const patientsWithNotes = patients.map(p => ({ ...p, notes: "" }));
  
  return (
    <Base>
      <div className="container mx-auto py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-left mb-4">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Microscope Camera</h1>
            <p className="text-muted-foreground">
              Capture high-resolution images of your microscope samples
            </p>
          </div>
          <CameraClient patients={patientsWithNotes} />
        </div>
      </div>
    </Base>
  );
} 