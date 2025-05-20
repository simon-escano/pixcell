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
import { PatientSearchCombobox } from "@/components/patients/patient-search-combobox";
import UploadSampleFile from "./upload-sample-file";
import toast from "react-hot-toast";
import { uploadSampleAction } from "@/actions/samples";
import { getErrorMessage } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Input } from "../ui/input";

export default function UploadSampleDrawer({ patients }: { patients: any[] }) {
  const router = useRouter();
  const [selectedPatient, setSelectedPatient] = React.useState<string>("");
  const [file, setFile] = React.useState<File | null>(null);
  const [sampleName, setSampleName] = React.useState<string>("");
  const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false);

  const handleSubmit = async () => {
    if (!selectedPatient || !file || !sampleName.trim()) {
      toast.error("Select a patient, enter sample name, and upload a sample.");
      return;
    }

    try {
      await uploadSampleAction(selectedPatient, file, sampleName.trim());
      toast.success("Sample uploaded successfully.");
      setDrawerOpen(false);
      router.refresh();
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
              <div className="flex flex-col">
                <Input
                  id="sampleName"
                  className="rounded-t-lg rounded-b-none border-2 border-dashed shadow-none"
                  placeholder="Sample name"
                  value={sampleName}
                  onChange={(e) => setSampleName(e.target.value)}
                />
                <UploadSampleFile onFileChange={setFile} />
              </div>
            </div>
            <DrawerFooter className="flex w-full flex-row pt-0">
              <DrawerClose asChild>
                <Button variant="outline" className="flex-1">
                  Cancel
                </Button>
              </DrawerClose>
              <Button onClick={handleSubmit} className="flex-1">
                Submit
              </Button>
            </DrawerFooter>
          </>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
