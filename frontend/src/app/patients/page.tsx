import Base from "@/components/base";
import { DataTable } from "@/components/data-table";
import PatientTable from "@/components/patient-table";
import { getAllPatients } from "@/db/queries/select";

export default async function PatientsPage() {
  const patients = await getAllPatients();

  return (
    <Base>
      <div className="h-full overflow-y-auto p-4">
        <PatientTable patients={patients} />
      </div>
    </Base>
  );
}

export const metadata = {
  title: "Patients - PixCell",
};
