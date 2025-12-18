"use client";
import { ImageUp, Loader2 } from "lucide-react";
import * as React from "react";

import { editSampleAction, uploadSampleAction } from "@/actions/samples";
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
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { Input } from "../ui/input";
import UploadSampleFile from "./upload-sample-file";
import { PatientSearchCombobox } from "../patients/patient-search-combobox";
import { MetaPatient, MetaSample, MetaSampleImage } from "@/app/organizations/[organizationId]/samples/types";

interface SampleDrawerProps {
  patients: MetaPatient[];
  sample?: MetaSample;
  patient?: MetaPatient;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  existingSampleImages?: MetaSampleImage[];
}

export default function SampleDrawer({ 
  patients, 
  sample, 
  patient,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  existingSampleImages = []
}: SampleDrawerProps) {
  const router = useRouter();
  const params = useParams();
  const orgId = (params as any)?.organizationId || "";
  const isEditMode = !!(sample);
  
  const [selectedPatient, setSelectedPatient] = React.useState<string>(
    patient?.id || ""
  );
  const [files, setFiles] = React.useState<File[]>([]);
  const [sampleName, setSampleName] = React.useState<string>(
    sample?.sampleName || ""
  );
  const [internalDrawerOpen, setInternalDrawerOpen] = React.useState<boolean>(false);
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [currentExistingImages, setCurrentExistingImages] = React.useState<MetaSampleImage[]>(existingSampleImages);
  
  // Use controlled state if provided, otherwise use internal state
  const drawerOpen = controlledOpen !== undefined ? controlledOpen : internalDrawerOpen;
  const setDrawerOpen = controlledOnOpenChange || setInternalDrawerOpen;

  // Initialize form when sample data is provided
  React.useEffect(() => {
    if (sample) {
      setSampleName(sample.sampleName || "");
    }
    if (patient) {
      setSelectedPatient(patient.id);
    }
    if (existingSampleImages.length > 0) {
      setCurrentExistingImages(existingSampleImages);
    }
  }, [sample, patient, existingSampleImages]);

  const handleSubmit = async () => {
    if (!selectedPatient || (files.length === 0 && currentExistingImages.length === 0) || !sampleName.trim()) {
      toast.error(`Select a patient, enter sample name, and ${isEditMode ? 'have' : 'upload'} at least one sample.`);
      return;
    }

    setIsUploading(true);
    const actionText = isEditMode ? 'Saving' : 'Uploading';
    const uploadingToast = toast.loading(
      `${actionText}...`
    );

    try {
      if (isEditMode) {
        // Get IDs of images that were deleted (in original but not in current)
        const originalIds = new Set(existingSampleImages.map(img => img.id));
        const currentIds = new Set(currentExistingImages.map(img => img.id));
        const deletedIds = Array.from(originalIds).filter(id => !currentIds.has(id));
        
        // Import the action that handles both uploads and deletions
        const { editSampleWithDeletionsAction } = await import("@/actions/samples");
        await editSampleWithDeletionsAction(sample.id, files, deletedIds);
        
        const messages = [];
        if (files.length > 0) {
          messages.push(`${files.length} new image${files.length !== 1 ? 's' : ''} added`);
        }
        if (deletedIds.length > 0) {
          messages.push(`${deletedIds.length} image${deletedIds.length !== 1 ? 's' : ''} deleted`);
        }
        
        toast.success(messages.join(', ') || 'Sample updated successfully.', {
          id: uploadingToast,
        });
        setDrawerOpen(false);
        setFiles([]);
        router.refresh();
      } else {
        const result = await uploadSampleAction(selectedPatient, files, sampleName.trim(), orgId);
        if (result && result.success && result.sampleId) {
          toast.success(`${files.length} sample(s) uploaded successfully.`, {
            id: uploadingToast,
          });
          setDrawerOpen(false);
          setFiles([]);
          setSampleName("");
          setSelectedPatient("");
          // Redirect to the new sample page (organization-scoped when available)
          if (orgId) router.push(`/organizations/${orgId}/samples/${result.sampleId}`);
          else router.push(`/samples/${result.sampleId}`);
          return;
        } else {
          toast.error("Failed to upload sample.", { id: uploadingToast });
        }
      }
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
    return isEditMode ? "Edit sample" : "Upload sample";
  };

  const getDrawerDescription = () => {
    return isEditMode 
      ? "Edit sample name, patient, and manage images"
      : "Submit sample images to share or for analysis";
  };

  return (
    <div className="flex flex-col gap-2">
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
        {children && (
          <DrawerTrigger disabled={isUploading} asChild>
            {children}
          </DrawerTrigger>
        )}
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
                  <div className="relative">
                    <Input
                      id="sampleName"
                      className="pr-4 rounded-t-lg rounded-b-none border-2 border-dashed shadow-none"
                      placeholder="Enter sample name"
                      value={sampleName}
                      onChange={(e) => setSampleName(e.target.value)}
                      disabled={isUploading}
                      required
                    />
                    {!sampleName && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-destructive mr-2">*</span>
                    )}
                  </div>

                  <UploadSampleFile 
                    onFilesChange={setFiles} 
                    files={files}
                    existingImages={currentExistingImages}
                    onExistingImagesChange={setCurrentExistingImages}
                  />
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
                  disabled={isUploading || (files.length === 0 && currentExistingImages.length === 0)}
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
export function UploadSampleDrawerForPatient({ patientId, className, organizationId }: { patientId: string, className?: string, organizationId?: string }) {
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
      await uploadSampleAction(patientId, files, sampleName.trim(), organizationId);
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