"use client";
import * as React from "react";
import { ImageUp } from "lucide-react";

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
import { PatientSearchCombobox } from "./patient-search-combobox";
import UploadSampleFile from "./upload-sample-file";
import toast from "react-hot-toast";
import { uploadSampleAction } from "@/actions/upload-sample";
import { getErrorMessage } from "@/lib/utils";

export default function UploadSampleDrawer({ patients }: { patients: any[] }) {
  const [selectedPatient, setSelectedPatient] = React.useState<string>("");
  const [file, setFile] = React.useState<File | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false); // State to control drawer visibility

  const handleSubmit = async () => {
    if (!selectedPatient || !file) {
      toast.error("Select a patient and upload a sample.");
      return;
    }

    try {
      await uploadSampleAction(selectedPatient, file);
      toast.success("Sample uploaded successfully.");

      // Close the drawer after successful upload
      setDrawerOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 flex-1 justify-start duration-200 ease-linear">
          <ImageUp />
          <span>Upload sample</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Upload sample</DrawerTitle>
            <DrawerDescription>
              Submit a sample to share or for analysis
            </DrawerDescription>
          </DrawerHeader>
          <>
            <div className="flex flex-col gap-4 p-4">
              <PatientSearchCombobox
                patients={patients}
                value={selectedPatient}
                onChange={setSelectedPatient}
              />
              <UploadSampleFile onFileChange={setFile} />
            </div>
            <DrawerFooter>
              <Button onClick={handleSubmit}>Submit</Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
