"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import CameraModal from "@/components/samples/camera-client";

export default function CameraSidebarButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start rounded-lg shadow-sm flex items-center gap-2"
        onClick={() => setOpen(true)}
      >
        <Camera className="size-4" />
        Open Camera
      </Button>
      <CameraModal open={open} onClose={() => setOpen(false)} onCapture={() => setOpen(false)} />
    </>
  );
} 