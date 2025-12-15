"use client";

import { deletePatient } from "@/actions/patients";
import { Patient } from "@/db/schema";

type PatientWithImage = Patient & {
  imageUrl?: string | null;
};
import { format } from "date-fns";
import { Plus, Upload } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useMemo, useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { CustomAlertDialog } from "../custom-alert-dialog";
import NameEmailAvatar from "../name-email-avatar";
import SearchInput from "../search-input";
import SelectionBar from "../selection-bar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import FilterDropdown, { SortDirection } from "../filter-dropdown";
import { PatientDialog } from "./patient-dialog";
import Papa from "papaparse";

interface PatientsListProps {
  patients: PatientWithImage[];
  organizationId: string;
  isAdmin?: boolean;
}

type SortField = "name" | "email" | "phone" | "address" | "sex" | "bloodType" | "height" | "weight" | "date";

const PatientsList = ({ patients, organizationId, isAdmin = false }: PatientsListProps) => {
  const router = useRouter();
  const params = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithImage | null>(null);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [visibleFields, setVisibleFields] = useState({
    phone: true,
    address: true,
    sex: true,
    bloodType: true,
    height: false,
    weight: false,
    date: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [currentDoctorId, setCurrentDoctorId] = useState<string>("");

  useEffect(() => {
    async function fetchDoctors() {
      if (organizationId) {
        const res = await fetch(`/api/doctors?organizationId=${organizationId}`);
        const allDoctors = await res.json();
        setDoctors(allDoctors);
      }
    }
    fetchDoctors();
  }, [organizationId]);

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

  const filteredAndSortedPatients = useMemo(() => {
    let filtered = patients.filter((patient) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        patient.firstName?.toLowerCase().includes(searchLower) ||
        patient.lastName?.toLowerCase().includes(searchLower) ||
        patient.email?.toLowerCase().includes(searchLower) ||
        patient.contactNumber?.toLowerCase().includes(searchLower) ||
        patient.address?.toLowerCase().includes(searchLower) ||
        patient.bloodType?.toLowerCase().includes(searchLower) ||
        patient.id?.toLowerCase().includes(searchLower)
      );
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case "email":
          comparison = (a.email || "").localeCompare(b.email || "");
          break;
        case "phone":
          comparison = (a.contactNumber || "").localeCompare(b.contactNumber || "");
          break;
        case "address":
          comparison = (a.address || "").localeCompare(b.address || "");
          break;
        case "sex":
          comparison = (a.sex || "").localeCompare(b.sex || "");
          break;
        case "bloodType":
          comparison = (a.bloodType || "").localeCompare(b.bloodType || "");
          break;
        case "height":
          comparison = (a.height || 0) - (b.height || 0);
          break;
        case "weight":
          comparison = (a.weight || 0) - (b.weight || 0);
          break;
        case "date":
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
        default:
          return 0;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [patients, searchQuery, sortField, sortDirection]);

  const handleRowClick = (e: React.MouseEvent, patientId: string, index: number) => {
    const isShift = e.shiftKey;
    const isCtrl = e.ctrlKey || e.metaKey;

    if (isShift && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeIds = filteredAndSortedPatients.slice(start, end + 1).map((p) => p.id);
      
      if (isCtrl) {
        setSelectedIds((prev) => {
          const newIds = new Set([...prev, ...rangeIds]);
          return Array.from(newIds);
        });
      } else {
        setSelectedIds(rangeIds);
      }
      setLastSelectedIndex(index);
    } else if (isCtrl) {
      setSelectedIds((prev) => {
        if (prev.includes(patientId)) {
          return prev.filter((id) => id !== patientId);
        } else {
          return [...prev, patientId];
        }
      });
      setLastSelectedIndex(index);
    } else {
      const target = e.target as HTMLElement;
      const isInteractive = 
        target.closest('button') ||
        target.closest('[role="button"]') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('[data-prevent-navigation]');
      
      if (!isInteractive) {
        router.push(`/organizations/${organizationId}/patients/${patientId}`);
      }
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent, patientId: string, index: number) => {
    e.stopPropagation();
    
    const isShift = e.shiftKey;
    const isCtrl = e.ctrlKey || e.metaKey;

    if (isShift && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeIds = filteredAndSortedPatients.slice(start, end + 1).map((p) => p.id);
      
      if (isCtrl) {
        setSelectedIds((prev) => {
          const newIds = new Set([...prev, ...rangeIds]);
          return Array.from(newIds);
        });
      } else {
        setSelectedIds(rangeIds);
      }
      setLastSelectedIndex(index);
    } else if (isCtrl) {
      setSelectedIds((prev) => {
        if (prev.includes(patientId)) {
          return prev.filter((id) => id !== patientId);
        } else {
          return [...prev, patientId];
        }
      });
      setLastSelectedIndex(index);
    } else {
      setSelectedIds((prev) => {
        if (prev.includes(patientId)) {
          return prev.filter((id) => id !== patientId);
        } else {
          return [...prev, patientId];
        }
      });
      setLastSelectedIndex(index);
    }
  };

  const handleBulkDelete = async () => {
    const failed: { id: string; error: string }[] = [];
    for (const id of selectedIds) {
      const res = await deletePatient(id);
      if (!res.success) {
        failed.push({ id, error: res.error || 'Unknown error' });
      }
    }
    if (failed.length > 0) {
      toast.error(failed.map(f => `ID: ${f.id} - ${f.error}`).join('\n'));
    } else {
      toast.success("Selected patients deleted.");
    }
    setSelectedIds([]);
    setBatchDeleteOpen(false);
    router.refresh();
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
            toast.success("Patients imported successfully.");
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

  return (
    <div className="relative h-full overflow-y-auto">
      {/* Header */}
      <div className="flex gap-2 justify-between px-6 py-2 border-b items-center sticky top-0 bg-background z-10">
        <div className="flex-1 flex gap-2 items-center h-full">
          <SearchInput
            placeholder="Search patients..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <div className="flex gap-2">
          <FilterDropdown
            sortFields={[
              { value: "name", label: "Name" },
              { value: "email", label: "Email" },
              { value: "phone", label: "Phone" },
              { value: "address", label: "Address" },
              { value: "sex", label: "Sex" },
              { value: "bloodType", label: "Blood Type" },
              { value: "height", label: "Height" },
              { value: "weight", label: "Weight" },
              { value: "date", label: "Date" },
            ]}
            sortField={sortField}
            onSortFieldChange={(field) => setSortField(field as SortField)}
            sortDirection={sortDirection}
            onSortDirectionChange={setSortDirection}
            displayProperties={[
              { value: "phone", label: "Phone" },
              { value: "address", label: "Address" },
              { value: "sex", label: "Sex" },
              { value: "bloodType", label: "Blood Type" },
              { value: "height", label: "Height" },
              { value: "weight", label: "Weight" },
              { value: "date", label: "Date" },
            ]}
            visibleFields={visibleFields}
            onVisibleFieldsChange={(fields) => {
              setVisibleFields({
                phone: fields.phone ?? visibleFields.phone,
                address: fields.address ?? visibleFields.address,
                sex: fields.sex ?? visibleFields.sex,
                bloodType: fields.bloodType ?? visibleFields.bloodType,
                height: fields.height ?? visibleFields.height,
                weight: fields.weight ?? visibleFields.weight,
                date: fields.date ?? visibleFields.date,
              });
            }}
          />
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default">
                  <Plus />
                  Add Patient
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setAddOpen(true)}>
                  <Plus className="size-4" />
                  Add Manually
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportClick}>
                  <Upload className="size-4" />
                  Import via CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Table */}
      <div className="relative">
        <table className="w-full">
          <thead className="border-b">
            <tr>
              {isAdmin && <th className="text-left text-xs font-normal w-12"></th>}
              <th className={`text-left text-xs py-2 font-normal text-muted-foreground ${isAdmin ? 'pr-6' : 'pl-11 pr-6'}`}>Patient</th>
              {visibleFields.phone && <th className="text-left text-xs font-normal text-muted-foreground pr-6">Phone</th>}
              {visibleFields.address && <th className="text-left text-xs font-normal text-muted-foreground pr-6">Address</th>}
              {visibleFields.sex && <th className="text-left text-xs font-normal text-muted-foreground pr-6">Sex</th>}
              {visibleFields.bloodType && <th className="text-left text-xs font-normal text-muted-foreground pr-6">Blood Type</th>}
              {visibleFields.height && <th className="text-left text-xs font-normal text-muted-foreground pr-6">Height</th>}
              {visibleFields.weight && <th className="text-left text-xs font-normal text-muted-foreground pr-6">Weight</th>}
              {visibleFields.date && <th className="text-left text-xs font-normal text-muted-foreground pr-6">Added</th>}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedPatients.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 9 : 8} className="text-center text-muted-foreground py-8">
                  No patients found
                </td>
              </tr>
            ) : (
              filteredAndSortedPatients.map((patient, index) => {
                const date = patient.createdAt ? format(new Date(patient.createdAt), "MMM d") : null;
                return (
                  <tr
                    key={patient.id}
                    className={`group hover:bg-accent/50 cursor-pointer transition-colors h-[50px] ${!isAdmin ? '' : ''}`}
                    onClick={(e) => handleRowClick(e, patient.id, index)}
                  >
                    {isAdmin && (
                      <td>
                        <div className={`px-4 flex items-center justify-center transition-opacity pointer-events-none group-hover:pointer-events-auto ${selectedIds.includes(patient.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          <Checkbox
                            checked={selectedIds.includes(patient.id)}
                            onClick={(e) => handleCheckboxClick(e, patient.id, index)}
                          />
                        </div>
                      </td>
                    )}
                    <td className={`${isAdmin ? 'pr-6' : 'pl-11 pr-6'}`}>
                      <NameEmailAvatar
                        imageUrl={patient.imageUrl}
                        firstName={patient.firstName}
                        lastName={patient.lastName}
                        email={patient.email}
                        onClick={() => router.push(`/organizations/${organizationId}/patients/${patient.id}`)}
                      />
                    </td>
                    {visibleFields.phone && (
                      <td className="pr-6 text-sm">{patient.contactNumber || "-"}</td>
                    )}
                    {visibleFields.address && (
                      <td className="pr-6 text-sm">{patient.address || "-"}</td>
                    )}
                    {visibleFields.sex && (
                      <td className="pr-6 text-sm">{patient.sex || "-"}</td>
                    )}
                    {visibleFields.bloodType && (
                      <td className="pr-6 text-sm">{patient.bloodType || "-"}</td>
                    )}
                    {visibleFields.height && (
                      <td className="pr-6 text-sm">{patient.height ? `${patient.height} cm` : "-"}</td>
                    )}
                    {visibleFields.weight && (
                      <td className="pr-6 text-sm">{patient.weight ? `${patient.weight} kg` : "-"}</td>
                    )}
                    {visibleFields.date && (
                      <td className="pr-6 text-sm text-muted-foreground">{date || "-"}</td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Dialogs */}
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
        organizationId={organizationId}
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
      <CustomAlertDialog
        open={batchDeleteOpen}
        onOpenChange={setBatchDeleteOpen}
        title="Are you absolutely sure?"
        description={
          <>
            This action cannot be undone. This will permanently delete {selectedIds.length} patients and remove all their data from our system.
          </>
        }
        onConfirm={handleBulkDelete}
        confirmText="Continue"
        cancelText="Cancel"
      />
      {isAdmin && (
        <SelectionBar
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          onDelete={() => setBatchDeleteOpen(true)}
          deleteLabel="Delete"
          onEdit={() => {
            if (selectedIds.length === 1) {
              const patient = filteredAndSortedPatients.find(p => p.id === selectedIds[0]);
              if (patient) {
                setSelectedPatient(patient);
                setEditOpen(true);
              }
            }
          }}
          editLabel="Edit"
        />
      )}
    </div>
  );
};

export default PatientsList;

