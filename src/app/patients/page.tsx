import Base from "@/components/base";
import { DataTable } from "@/components/data-table";
import { db } from "@/db";
import { patient } from "@/db/schema";

export default async function PatientsPage() {
  const patients = await db.select().from(patient);

  const transformedPatients: {
    id: string;
    birthDate: string;
    sex: "male" | "female";
    firstName: string;
    lastName: string;
    notes: string;
    createdAt: string;
  }[] = patients.map((p) => ({
    ...p,
    sex:
      p.sex === "male" || p.sex === "female"
        ? (p.sex as "male" | "female")
        : "male",
    notes: p.notes || "",
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <Base>
      <div className="h-full overflow-y-auto p-4">
        <DataTable data={transformedPatients} />
      </div>
    </Base>
  );
}

export const metadata = {
  title: "Patients - PixCell",
};
