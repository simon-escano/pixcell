"use client";
import * as React from "react";
import { ImageUp, Camera, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { PatientSearchCombobox } from "@/components/patients/patient-search-combobox";
import UploadSampleFile from "./upload-sample-file";
import toast from "react-hot-toast";
import { uploadSampleAction } from "@/actions/samples";
import { getErrorMessage } from "@/utils";
import { useRouter } from "next/navigation";
import { Input } from "../ui/input";

export default function UploadSampleDrawer({ patients }: { patients: any[] }) {
  const router = useRouter();
  const [selectedPatient, setSelectedPatient] = React.useState<string>("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [sampleName, setSampleName] = React.useState<string>("");
  const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false);
  const [isUploading, setIsUploading] = React.useState<boolean>(false);

  const handleSubmit = async () => {
    if (!selectedPatient || files.length === 0 || !sampleName.trim()) {
      toast.error("Select a patient, enter sample name, and upload at least one sample.");
      return;
    }

    setIsUploading(true);
    const uploadingToast = toast.loading(
      `Uploading ${files.length} sample${files.length !== 1 ? 's' : ''}...`
    );

    try {
      await uploadSampleAction(selectedPatient, files, sampleName.trim());
      
      toast.success(`${files.length} sample(s) uploaded successfully.`, {
        id: uploadingToast,
      });
      setDrawerOpen(false);
      setFiles([]);
      setSampleName("");
      setSelectedPatient("");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error), {
        id: uploadingToast,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    if (!isUploading) {
      setFiles([]);
      setSampleName("");
      setSelectedPatient("");
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <Drawer 
        open={drawerOpen} 
        onOpenChange={(open) => {
          if (!isUploading) {
            setDrawerOpen(open);
            if (!open) {
              resetForm();
            }
          }
        }}
      >
        <DrawerTrigger asChild>
          <Button 
            className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground w-full justify-start rounded-lg shadow-sm"
            disabled={isUploading}
          >
            <ImageUp />
            <span>Upload samples</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Upload samples</DrawerTitle>
              <DrawerDescription>
                Submit samples to share or for analysis
              </DrawerDescription>
            </DrawerHeader>
            <>
              <div className="flex flex-col gap-4 p-4">
                <PatientSearchCombobox
                  patients={patients}
                  value={selectedPatient}
                  onChange={setSelectedPatient}
                />
                <div className="flex flex-col">
                  <Input
                    id="sampleName"
                    className="rounded-t-lg rounded-b-none border-2 border-dashed shadow-none"
                    placeholder="Enter sample name"
                    value={sampleName}
                    onChange={(e) => setSampleName(e.target.value)}
                    disabled={isUploading}
                  />
                  <UploadSampleFile onFilesChange={setFiles} files={files} />
                </div>
              </div>
              <DrawerFooter className="flex w-full flex-row pt-0">
                <DrawerClose asChild>
                  <Button variant="outline" className="flex-1" disabled={isUploading}>
                    Cancel
                  </Button>
                </DrawerClose>
                <Button 
                  onClick={handleSubmit} 
                  className="flex-1" 
                  disabled={isUploading || files.length === 0}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    `Submit (${files.length})`
                  )}
                </Button>
              </DrawerFooter>
            </>
          </div>
        </DrawerContent>
      </Drawer>
      <Button
        variant="outline"
        className="border-2 hover:bg-secondary/80 w-full justify-start rounded-lg shadow-sm"
        onClick={() => router.push('/camera')}
        disabled={isUploading}
      >
        <Camera className="text-primary" />
        <span>Camera</span>
      </Button>
    </div>
  );
}

// New drawer for uploading samples for a specific patient
export function UploadSampleDrawerForPatient({ patientId, className }: { patientId: string, className?: string }) {
  const router = useRouter();
  const [files, setFiles] = React.useState<File[]>([]);
  const [sampleName, setSampleName] = React.useState<string>("");
  const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false);

  const handleSubmit = async () => {
    if (!files.length || !sampleName.trim()) {
      toast.error("Enter sample name and upload at least one sample.");
      return;
    }
    try {
      await uploadSampleAction(patientId, files, sampleName.trim());
      toast.success(`${files.length} sample(s) uploaded successfully.`);
      setDrawerOpen(false);
      setFiles([]);
      setSampleName("");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <Button className={"bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground rounded-lg shadow-sm " + (className ?? "") }>
            <ImageUp />
            <span>Add Sample</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Add Sample</DrawerTitle>
              <DrawerDescription>
                Submit a sample for this patient
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-col gap-4 p-4">
              <Input
                id="sampleName"
                className="rounded-t-lg rounded-b-none border-2 border-dashed shadow-none"
                placeholder="Enter sample name"
                value={sampleName}
                onChange={(e) => setSampleName(e.target.value)}
              />
              <UploadSampleFile onFilesChange={setFiles} files={files} />
            </div>
            <DrawerFooter className="flex w-full flex-row pt-0">
              <DrawerClose asChild>
                <Button variant="outline" className="flex-1">
                  Cancel
                </Button>
              </DrawerClose>
              <Button onClick={handleSubmit} className="flex-1">
                Submit ({files.length})
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}