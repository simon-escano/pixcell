import Base from "@/components/base";
import PatientsTable from "@/components/patients-table";
import { getAllPatients } from "@/db/queries/select";

export default async function PatientsPage() {
  const patients = await getAllPatients();

  return (
    <Base>
      <div className="h-full overflow-y-auto p-4">
        <PatientsTable patients={patients} />
      </div>
    </Base>
  );
}

export const metadata = {
  title: "Patients - PixCell",
};
