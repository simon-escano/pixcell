"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CircleDot, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { PatientSearchCombobox } from "@/components/patient-search-combobox";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { uploadSampleAction } from "@/actions/samples";

interface CapturedImage {
  blob: Blob;
  previewUrl: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  sex: string;
  address: string;
  contactNumber: string;
  height: number;
  weight: number;
  bloodType: string;
  notes: string | null;
  imageUrl: string | null;
  createdAt: Date;
}

interface CameraClientProps {
  patients: Patient[];
}

export default function CameraClient({ patients }: CameraClientProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>("");
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [sampleName, setSampleName] = useState<string>("");

  const startCamera = useCallback(async () => {
    try {
      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(""); // Clear any existing errors
    } catch (err) {
      setError("Could not access camera. Please make sure you have granted camera permissions.");
      console.error('Camera error:', err);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Only run on mount

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const previewUrl = URL.createObjectURL(blob);
        setCapturedImage({ blob, previewUrl });
      }
    }, "image/jpeg", 0.9);
  };

  const handleUpload = async () => {
    if (!capturedImage || !selectedPatient || !sampleName.trim()) {
      toast.error("Please select a patient and enter a sample name.");
      return;
    }

    try {
      const file = new File([capturedImage.blob], "camera-capture.jpg", { type: "image/jpeg" });
      await uploadSampleAction(selectedPatient, file, sampleName.trim());
      toast.success("Sample uploaded successfully.");
      setIsUploadDrawerOpen(false);
      
      // Clean up and reset
      URL.revokeObjectURL(capturedImage.previewUrl);
      setCapturedImage(null);
      setSelectedPatient("");
      setSampleName("");
      
      // Restart the camera
      await startCamera();
      
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload sample");
    }
  };

  const handleRetake = async () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.previewUrl);
      setCapturedImage(null);
      await startCamera(); // Restart camera when retaking
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-lg overflow-hidden">
      {/* Main content */}
      <div className="relative aspect-video bg-black">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-destructive/10 text-destructive p-6 rounded-lg max-w-md text-center">
              {error}
            </div>
          </div>
        ) : capturedImage ? (
          <div className="relative w-full h-full">
            <img 
              src={capturedImage.previewUrl} 
              alt="Captured sample"
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <Button variant="outline" onClick={handleRetake}>
                Retake
              </Button>
              <Button onClick={() => setIsUploadDrawerOpen(true)}>
                Upload
              </Button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 bg-background/80 hover:bg-background"
              onClick={capturePhoto}
            >
              <CircleDot className="h-6 w-6 text-destructive animate-pulse" />
            </Button>
          </>
        )}
      </div>

      {/* Footer - only show when not viewing captured image */}
      {!capturedImage && (
        <div className="bg-card-foreground/10 p-4 flex justify-center gap-4">
          <Button 
            size="lg" 
            onClick={capturePhoto}
            className="rounded-full w-16 h-16 p-0 bg-primary hover:bg-primary/90"
          >
            <Camera className="h-8 w-8" />
          </Button>
        </div>
      )}

      {/* Upload Drawer */}
      <Drawer open={isUploadDrawerOpen} onOpenChange={setIsUploadDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Upload Sample</DrawerTitle>
              <DrawerDescription>
                Submit the captured sample for analysis
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 space-y-4">
              <PatientSearchCombobox
                patients={patients}
                value={selectedPatient}
                onChange={setSelectedPatient}
              />
              <Input
                placeholder="Sample name"
                value={sampleName}
                onChange={(e) => setSampleName(e.target.value)}
              />
            </div>
            <DrawerFooter className="flex flex-row pt-2">
              <DrawerClose asChild>
                <Button variant="outline" className="flex-1">
                  Cancel
                </Button>
              </DrawerClose>
              <Button onClick={handleUpload} className="flex-1">
                Upload
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
} 