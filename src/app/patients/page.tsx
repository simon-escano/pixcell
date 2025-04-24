import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import Header from "@/components/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import db from "@/db";
import { patient } from "@/db/schema";
import { getUser } from "@/lib/auth";

export default async function PatientsPage() {
  const patients = await db.select().from(patient);
  const user = await getUser();

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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="p-4">
          <DataTable data={transformedPatients} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export const metadata = {
  title: "Patients - PixCell",
};
