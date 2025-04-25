import Base from "@/components/base";
import { PatientInfo } from "@/components/patient-info";
import SampleWrapper from "@/components/sample-wrapper";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getPatientById, getSamplesByPatientId } from "@/db/queries/select";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

export default async function PatientPage({
  params,
}: {
  params: { "patient-id": string };
}) {
  const patientData = (await getPatientById(params["patient-id"]))[0];
  const samples = await getSamplesByPatientId(params["patient-id"]);

  return (
    <Base>
      <div className="flex flex-col gap-4">
        <div className="flex flex-1 gap-4">
          <Card className="flex flex-col items-start gap-4 p-4">
            <Avatar className="h-40 w-full rounded-lg">
              <AvatarImage
                src={patientData.imageUrl || ""}
                alt={patientData.firstName + patientData.lastName}
                className="h-full w-full object-cover"
              />
              <AvatarFallback className="rounded-lg">
                {patientData.firstName.charAt(0)}
                {patientData.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <CardFooter className="flex flex-col items-start gap-1 overflow-hidden p-0 text-sm">
              <CardTitle className="text-2xl font-semibold">
                <span>{patientData.firstName}</span>{" "}
                <span>{patientData.lastName}</span>
              </CardTitle>
              <div className="flex gap-2 overflow-hidden font-medium">
                {patientData.email}
              </div>
              <div className="text-muted-foreground">
                {patientData.contactNumber}
              </div>
            </CardFooter>
          </Card>
          <PatientInfo patient={patientData} />
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {samples.map(async (sample) => (
            <SampleWrapper key={sample.id} sample={sample} />
          ))}
        </div>
      </div>
    </Base>
  );
}
