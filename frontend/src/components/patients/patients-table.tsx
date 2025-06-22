"use client";

import { deletePatient } from "@/actions/patients";
import { Patient } from "@/db/schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { PatientDialog } from "./patient-dialog";
import { DataTable } from "../data-table";
import { CustomAlertDialog } from "../custom-alert-dialog";

const PatientsTable = ({ patients }: { patients: Patient[] }) => {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditOpen(true);
  };

  const actionItems = [
    {
      label: "Copy Patient ID",
      onClick: (patient: Patient) => {
        navigator.clipboard.writeText(patient.id);
        toast.success("Patient ID copied to clipboard");
      },
    },
    {
      label: "Edit Patient",
      onClick: (patient: Patient) => handleEditPatient(patient),
    },
    {
      label: "Delete Patient",
      onClick: (patient: Patient) => {
        setSelectedPatient(patient);
        setDeleteOpen(true);
      },
      customRender: () => (
        <button className="text-red-500 hover:text-red-700">
          Delete Patient
        </button>
      ),
    },
  ];

  return (
    <div>
      <DataTable
        data={patients}
        excludeColumns={["id", "imageUrl", "birthDate", "createdAt", "notes"]}
        searchPlaceholder="Search patients..."
        searchableColumns={["firstName", "lastName", "contactNumber", "email"]}
        columnConfigs={[
          { key: "address", enableSorting: false, maxWidth: 200 },
          { key: "contactNumber", enableSorting: false },
        ]}
        actionItems={actionItems}
        customHeaderContent={<PatientDialog mode="add" />}
        onRowClick={(patient: Patient) => {
          router.push(`/patients/${patient.id}`);
        }}
      />
      <PatientDialog
        mode="edit"
        existingPatient={selectedPatient}
        open={editOpen}
        setOpen={setEditOpen}
        showTrigger={false}
      />
      <CustomAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Are you absolutely sure?"
        description={
          <>
            This action cannot be undone. This will permanently delete{" "}
            <span className="text-primary font-semibold">
              {selectedPatient?.firstName} {selectedPatient?.lastName}
            </span>{" "}
            and remove all their data from our system.
          </>
        }
        onConfirm={async () => {
          if (!selectedPatient) return;
          const res = await deletePatient(selectedPatient.id);
          if (res.success) {
            toast.success("Patient deleted");
            router.refresh();
          } else {
            toast.error(res.error || "Failed to delete patient.");
          }
        }}
        confirmText="Continue"
        cancelText="Cancel"
      />
    </div>
  );
};

export default PatientsTable;
