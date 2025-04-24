import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import db from "@/db";
import { patient } from "@/db/schema";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { eq } from "drizzle-orm";
import { TrendingUpIcon, User } from "lucide-react";

type PatientPageProps = {
  params: { "patient-id": string };
};

export default async function PatientPage({ params }: PatientPageProps) {
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
        <div className="p-4">
          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>{patientData.id}</CardDescription>
              <Avatar className="h-40 w-40 rounded-lg">
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                <span>{patientData.firstName}</span>{" "}
                <span>{patientData.lastName}</span>
              </CardTitle>
              <div className="absolute top-4 right-4">
                <Badge
                  variant="outline"
                  className="flex gap-1 rounded-lg text-xs"
                >
                  <TrendingUpIcon className="size-3" />
                  +12.5%
                </Badge>
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {patientData.email}
              </div>
              <div className="text-muted-foreground">
                {patientData.contactNumber}
              </div>
            </CardFooter>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
