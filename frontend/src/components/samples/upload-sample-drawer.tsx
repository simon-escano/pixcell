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
import { editSampleAction, uploadSampleAction } from "@/actions/samples";
import { getErrorMessage } from "@/utils";
import { useRouter } from "next/navigation";
import { Input } from "../ui/input";
import { MetaPatient, MetaSample, MetaSampleImage } from "@/app/samples/types";

interface SampleDrawerProps {
  patients: any[];
  sample?: MetaSample;
  sampleImages?: MetaSampleImage[];
  patient?: MetaPatient;
  children?: React.ReactNode;
}

// Helper function to convert MetaSampleImage to File-like object for display
const createFileFromSampleImage = (sampleImage: MetaSampleImage): File => {
  // Create a mock File object from the sample image
  // You might need to adjust this based on your MetaSampleImage structure
  const blob = new Blob([], { type: 'image/jpeg' }); // Empty blob, just for display
  const file = new File([blob], sampleImage.imageUrl || 'sample-image.jpg', {
    type: 'image/jpeg'
  });
  
  // Add custom properties for existing images
  (file as any).isExisting = true;
  (file as any).imageId = sampleImage.id;
  (file as any).imageUrl = sampleImage.imageUrl;
  
  return file;
};

export default function SampleDrawer({ 
  patients, 
  sample, 
  sampleImages, 
  patient,
  children
}: SampleDrawerProps) {
  const router = useRouter();
  const isEditMode = !!(sample && sampleImages);
  
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
    // Initialize files with existing sample images in edit mode
    if (sampleImages && sampleImages.length > 0) {
      const existingFiles = sampleImages.map(createFileFromSampleImage);
      setFiles(existingFiles);
    }
  }, [sample, patient, sampleImages]);

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
      // Filter out existing images that haven't changed
      const newFiles = files.filter(file => !(file as any).isExisting);
      
      // In edit mode, you might want to call a different action like updateSampleAction
      if (isEditMode) {
        // TODO: Replace with your update sample action
        // await updateSampleAction(sample.id, selectedPatient, newFiles, sampleName.trim());
        await editSampleAction(sample.id, newFiles);
      } else {
        await uploadSampleAction(selectedPatient, files, sampleName.trim());
      }
      
      const successText = isEditMode ? 'saved' : 'uploaded';
      toast.success(`${files.length} sample(s) ${successText} successfully.`, {
        id: uploadingToast,
      });
      setDrawerOpen(false);
      
      // Only reset form in upload mode
      if (!isEditMode) {
        setFiles([]);
        setSampleName("");
        setSelectedPatient("");
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
        // In edit mode, reset to original values
        setSampleName(sample?.sampleName || "");
        setSelectedPatient(patient?.id || "");
        // Reset files to original sample images
        if (sampleImages && sampleImages.length > 0) {
          const existingFiles = sampleImages.map(createFileFromSampleImage);
          setFiles(existingFiles);
        } else {
          setFiles([]);
        }
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
      return isUploading ? "Saving..." : `Save (${files.length})`;
    }
    return isUploading ? "Uploading..." : `Submit (${files.length})`;
  };

  const getDrawerTitle = () => {
    return isEditMode ? "Edit samples" : "Upload samples";
  };

  const getDrawerDescription = () => {
    return isEditMode 
      ? "Modify samples or update analysis"
      : "Submit samples to share or for analysis";
  };

  // Debug logging to check patient selection
  React.useEffect(() => {
    console.log("Selected patient:", selectedPatient);
    console.log("Patient prop:", patient);
    console.log("Patients array:", patients);
  }, [selectedPatient, patient, patients]);

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