"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { DrawerClose, DrawerFooter } from "@/components/ui/drawer";
import { PatientSearchCombobox } from "./patient-search-combobox";
import UploadSampleFile from "./upload-sample-file";

import { uploadSampleAction } from "@/actions/upload-sample";
import { getErrorMessage } from "@/lib/utils";
import toast from "react-hot-toast";

export default function UploadSampleDrawerClient({
  patients,
}: {
  patients: any[];
}) {
  const [selectedPatient, setSelectedPatient] = React.useState<string>("");
  const [file, setFile] = React.useState<File | null>(null);

  const handleSubmit = async () => {
    if (!selectedPatient || !file) {
      toast.error("Please select a patient to upload sample.");
      return;
    }

    try {
      await uploadSampleAction(selectedPatient, file);

      toast.success("Sample uploaded successfully.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
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
  );
}
