"use client";

import { deletePatient } from "@/actions/patients";
import { Patient } from "@/db/schema";
import { useRouter, useParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { PatientDialog } from "./patient-dialog";
import { DataTable } from "../data-table";
import { CustomAlertDialog } from "../custom-alert-dialog";
import UserButton from "../members/user-button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { CirclePlus, Plus, Upload, XCircle, Trash2 } from "lucide-react";
import ClientDate from "../client-date";
// @ts-ignore: If types are missing for papaparse
import Papa from "papaparse";

function ImportErrorToast({ title, failed }: { title: string; failed: any[] }) {
  return (
    <div className="flex items-start gap-3 bg-red-50 shadow-lg rounded-md p-4 border-l-4 border-red-400">
      <XCircle className="text-red-500 w-6 h-6 mt-1 flex-shrink-0" />
      <div>
        <div className="font-semibold text-red-700 mb-2">{title}</div>
        <ul className="pl-4 list-disc space-y-1">
          {failed.map((f, i) => (
            <li key={i}>
              <span className="font-medium">{f.email}</span>
              <span className="text-red-600 font-normal">: {f.error}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const PatientsTable = ({ patients }: { patients: Patient[] }) => {
  const router = useRouter();
  const params = useParams();
  const orgId = (params as any)?.organizationId || "";
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [currentDoctorId, setCurrentDoctorId] = useState<string>("");

  // Fetch doctors once on mount with organizationId
  useEffect(() => {
    async function fetchDoctors() {
      if (orgId) {
        const res = await fetch(`/api/doctors?organizationId=${orgId}`);
        const allDoctors = await res.json();
        setDoctors(allDoctors);
      }
    }
    fetchDoctors();
  }, [orgId]);

  // Fetch current doctor when editing a patient
  useEffect(() => {
    async function fetchCurrentDoctor() {
      if (editOpen && selectedPatient) {
        const res = await fetch(`/api/patient/${selectedPatient.id}/doctor`);
        const data = await res.json();
        setCurrentDoctorId(data.doctorId || "");
      } else {
        setCurrentDoctorId("");
      }
    }
    fetchCurrentDoctor();
  }, [editOpen, selectedPatient]);

  // Handler to update doctor assignment (should call an API route or server action)
  const handleDoctorChange = async (doctorId: string) => {
    if (selectedPatient) {
      await fetch('/api/patient/doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: selectedPatient.id, doctorId })
      });
    }
    setCurrentDoctorId(doctorId);
  };

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditOpen(true);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: Papa.ParseResult<any>) => {
        try {
          const response = await fetch("/api/patients/batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(results.data),
          });
          const result = await response.json();
          if (response.ok) {
            const failed = result.results?.filter((r: any) => !r.success) || [];
            if (failed.length > 0) {
              toast.custom(
                <ImportErrorToast
                  title="Some patients were not imported:"
                  failed={failed}
                />, { duration: 2000 }
              );
            } else {
              toast.success("Patients imported successfully.");
            }
            router.refresh();
          } else {
            toast.error(result.message || "Failed to import patients.");
          }
        } catch (err) {
          toast.error("Error importing patients.");
        }
      },
      error: () => {
        toast.error("Failed to parse CSV file.");
      },
    });
    e.target.value = "";
  };

  const handleAddManual = () => {
    setAddOpen(true);
  };

  const addPatientDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="ml-2" variant="default">
          <CirclePlus/>
          Add Patient
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleAddManual}>
          <Plus className="mr-2 h-4 w-4" />
          Add Manually
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleImportClick}>
          <Upload className="mr-2 h-4 w-4" />
          Import via CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

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
        excludeColumns={["id", "imageId", "birthDate", "imageUrl", "createdBy","lastName"]}
        defaultHiddenColumns={ ["height", "weight"]}
        defaultSorting={[{ id: "createdAt", desc: true }]}
        searchPlaceholder="Search patients..."
        searchableColumns={["firstName", "lastName", "email", "bloodType"]}
        columnConfigs={[
          { key: "address", enableSorting: false, maxWidth: 200 },
          { key: "contactNumber", enableSorting: false },
          {
            key: "firstName", header:"Patient",
            customRender: (_: any, row?: any) => {
              // fallback: just render the first name if row is not available
              if (!row) return String(_);
                return (
                <UserButton
                  imageUrl={row.imageUrl || ""}
                  firstName={row.firstName}
                  lastName={row.lastName}
                  redirectUrl={orgId ? `/organizations/${orgId}/patients/${row.id}` : `/patients/${row.id}`}
                  roleName={"Patient"}
                />
              );
            },
          },
          { 
            key: "createdAt", 
            header: "Date", 
            enableSorting: true, 
            customRender: (value: string | Date) => value ? <ClientDate date={value} options={{ month: "long", day: "numeric", year: "numeric" }} /> : null 
          },
        ]}
        actionItems={actionItems}
        customHeaderContent={
          <div className="flex items-center gap-2">
            {addPatientDropdown}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        }
        onRowClick={(patient: Patient) => {
          if (orgId) router.push(`/organizations/${orgId}/patients/${patient.id}`)
          else router.push(`/patients/${patient.id}`)
        }}
        selectedRowIds={selectedIds}
        onSelectedRowIdsChange={setSelectedIds}
        getRowId={row => row.id}
        onBulkDelete={() => setBatchDeleteOpen(true)}
      />
      
      <PatientDialog
        mode="edit"
        existingPatient={selectedPatient}
        open={editOpen}
        setOpen={setEditOpen}
        showTrigger={false}
        doctors={doctors}
        currentDoctorId={currentDoctorId}
        onDoctorChange={handleDoctorChange}
      />
      <PatientDialog
        mode="add"
        open={addOpen}
        setOpen={setAddOpen}
        showTrigger={false}
        doctors={doctors}
        organizationId={orgId}
      />
      <CustomAlertDialog
        open={batchDeleteOpen}
        onOpenChange={setBatchDeleteOpen}
        title="Are you absolutely sure?"
        description={
          <>
            This action cannot be undone. This will permanently delete {selectedIds.length} patients and remove all their data from our system.
          </>
        }
        onConfirm={async () => {
          const failed: { id: string, error: string }[] = [];
          for (const id of selectedIds) {
            const res = await deletePatient(id);
            if (!res.success) {
              failed.push({ id, error: res.error || 'Unknown error' });
            }
          }
          if (failed.length > 0) {
            toast.error(
              failed.map(f => `ID: ${f.id} - ${f.error}`).join('\n')
            );
          } else {
            toast.success("Selected patients deleted.");
          }
          setSelectedIds([]);
          setBatchDeleteOpen(false);
          router.refresh();
        }}
        confirmText="Continue"
        cancelText="Cancel"
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
