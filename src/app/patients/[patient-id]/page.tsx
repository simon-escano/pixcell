import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header";
import { PatientInfo } from "@/components/patient-info";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Table, TableHeader, TableRow } from "@/components/ui/table";
import db from "@/db";
import { patient } from "@/db/schema";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { eq } from "drizzle-orm";
import { TrendingUpIcon, User } from "lucide-react";

export default async function PatientPage({
  params,
}: {
  params: { "patient-id": string };
}) {
  const data = await db
    .select()
    .from(patient)
    .where(eq(patient.id, params["patient-id"]));
  const patientData = data[0];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="flex items-start p-4">
          <div className="flex w-auto flex-col gap-4">
            <Card className="">
              <CardHeader className="relative">
                <Avatar className="h-40 w-40 rounded-lg">
                  <AvatarImage
                    src={patientData.imageUrl || ""}
                    alt={patientData.firstName + patientData.lastName}
                  />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  <span>{patientData.firstName}</span>{" "}
                  <span>{patientData.lastName}</span>
                </CardTitle>
                <div className="line-clamp-1 flex gap-2 font-medium">
                  {patientData.email}
                </div>
                <div className="text-muted-foreground">
                  {patientData.contactNumber}
                </div>
              </CardFooter>
            </Card>
            <Card className="@container/card flex-1 p-4">
              <PatientInfo patient={patientData} />
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
