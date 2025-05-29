import Base from "@/components/base";
import CameraClient from "./camera-client";
import { getAllPatients } from "@/db/queries/select";

export default async function CameraPage() {
  const patients = await getAllPatients();
  
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
          <CameraClient patients={patients} />
        </div>
      </div>
    </Base>
  );
} 