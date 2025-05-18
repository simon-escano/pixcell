import Base from "@/components/base";
import SampleWrapper from "@/components/sample-wrapper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPatientById,
  getReportCountByPatientId,
  getSamplesByPatientId,
} from "@/db/queries/select";
import { Mail, MapPin, Phone } from "lucide-react";

export default async function PatientPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const patientId = (await params).patientId;
  const patientData = await getPatientById(patientId);
  const samples = await getSamplesByPatientId(patientId);

  return (
    <Base>
      <div className="grid gap-4 p-4 sm:p-8 xl:grid-cols-4">
        <div className="space-y-4 xl:col-span-1">
          <Card className="bg-card text-card-foreground relative flex flex-col gap-6 rounded-xl border py-6 shadow-none">
            <CardContent className="px-6">
              <div className="space-y-12">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="size-20 rounded-full">
                    <AvatarImage
                      src={patientData.imageUrl || ""}
                      alt={patientData.firstName + patientData.lastName}
                      className="object-cover"
                    />
                    <AvatarFallback>
                      {patientData.firstName[0]}
                      {patientData.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h5 className="text-xl font-semibold">
                      {patientData.firstName} {patientData.lastName}
                    </h5>
                    <div className="text-muted-foreground text-sm">Patient</div>
                  </div>
                </div>
                <div className="bg-muted grid grid-cols-2 divide-x rounded-md border text-center *:py-3">
                  {[
                    { label: "Samples", value: samples.length },
                    {
                      label: "Reports",
                      value: getReportCountByPatientId(patientId),
                    },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <h5 className="text-lg font-semibold">{value}</h5>
                      <div className="text-muted-foreground text-sm">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-muted-foreground flex flex-col gap-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="size-4" /> {patientData.email}
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="size-4" /> {patientData.contactNumber}
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="size-5" /> {patientData.address}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="flex flex-col gap-6 shadow-none">
            <CardHeader>
              <CardTitle>Other Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Birth Date", value: patientData.birthDate },
                  { label: "Sex", value: "Male" },
                  { label: "Height", value: patientData.height + " cm" },
                  { label: "Weight", value: patientData.weight + " kg" },
                  { label: "Blood Type", value: patientData.bloodType },
                ].map(({ label, value }) => (
                  <Badge key={label} className="rounded-sm" variant="outline">
                    <span className="font-regular text-muted-foreground mr-1">
                      {label}
                    </span>{" "}
                    {value}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardHeader className="px-6">
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="px-6">{patientData.notes}</CardContent>
          </Card>
        </div>
        <div className="space-y-4 xl:col-span-3">
          <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {samples.map(async (sample) => (
              <SampleWrapper key={sample.id} sample={sample} />
            ))}
          </div>
        </div>
      </div>
    </Base>
  );
}
