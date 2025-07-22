"use client";
import { ImageUp, Loader2 } from "lucide-react";
import * as React from "react";

import { editSampleAction, uploadSampleAction } from "@/actions/samples";
import { MetaPatient, MetaSample, MetaSampleImage } from "@/app/samples/types";
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
import { getErrorMessage } from "@/utils";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Input } from "../ui/input";
import UploadSampleFile from "./upload-sample-file";
import { PatientSearchCombobox } from "../patients/patient-search-combobox";

interface SampleDrawerProps {
  patients: MetaPatient[];
  sample?: MetaSample;
  patient?: MetaPatient;
  children?: React.ReactNode;
}

export default function SampleDrawer({ 
  patients, 
  sample, 
  patient,
  children
}: SampleDrawerProps) {
  const router = useRouter();
  const isEditMode = !!(sample);
  
  const [selectedPatient, setSelectedPatient] = React.useState<string>(
    patient?.id || ""
  );
  const [files, setFiles] = React.useState<File[]>([]);
  const [sampleName, setSampleName] = React.useState<string>(
    sample?.sampleName || ""
  );
  const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false);
  const [isUploading, setIsUploading] = React.useState<boolean>(false);

  // Initialize form when sample data is provided
  React.useEffect(() => {
    if (sample) {
      setSampleName(sample.sampleName || "");
    }
    if (patient) {
      setSelectedPatient(patient.id);
    }
  }, [sample, patient]);

  const handleSubmit = async () => {
    if (!selectedPatient || files.length === 0 || !sampleName.trim()) {
      toast.error(`Select a patient, enter sample name, and ${isEditMode ? 'have' : 'upload'} at least one sample.`);
      return;
    }

    setIsUploading(true);
    const actionText = isEditMode ? 'Saving' : 'Uploading';
    const uploadingToast = toast.loading(
      `${actionText} ${files.length} sample${files.length !== 1 ? 's' : ''}...`
    );

    try {
      // In edit mode, always append new files to the sample
      if (isEditMode) {
        await editSampleAction(sample.id, files);
      } else {
        await uploadSampleAction(selectedPatient, files, sampleName.trim());
      }

      const successText = isEditMode ? 'saved' : 'uploaded';
      toast.success(`${files.length} sample(s) ${successText} successfully.`, {
        id: uploadingToast,
      });
      setDrawerOpen(false);

      // Only reset form in upload mode, or clear new files in edit mode
      if (!isEditMode) {
        setFiles([]);
        setSampleName("");
        setSelectedPatient("");
      } else {
        setFiles([]); // Only clear new files, keep previous images
      }

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
      if (isEditMode) {
        // In edit mode, only clear new files (do not reset to original sample images)
        setFiles([]);
        setSampleName(sample?.sampleName || "");
        setSelectedPatient(patient?.id || "");
      } else {
        // In upload mode, clear everything
        setFiles([]);
        setSampleName("");
        setSelectedPatient("");
      }
    }
  };

  const getButtonText = () => {
    if (isEditMode) {
      return isUploading ? "Saving..." : `Save`;
    }
    return isUploading ? "Uploading..." : `Submit (${files.length})`;
  };

  const getDrawerTitle = () => {
    return isEditMode ? "Add more sample images" : "Upload sample";
  };

  const getDrawerDescription = () => {
    return isEditMode 
      ? "Upload more sample images for this sample"
      : "Submit sample images to share or for analysis";
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
        <DrawerTrigger disabled={isUploading} asChild>
          {children}
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>{getDrawerTitle()}</DrawerTitle>
              <DrawerDescription>
                {getDrawerDescription()}
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
                      {isEditMode ? "Saving..." : "Uploading..."}
                    </>
                  ) : (
                    getButtonText()
                  )}
                </Button>
              </DrawerFooter>
            </>
          </div>
        </DrawerContent>
      </Drawer>
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