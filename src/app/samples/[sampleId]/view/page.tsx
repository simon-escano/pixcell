import Base from "@/components/base";
import { ShareDialog } from "@/components/share-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import UserButton from "@/components/user-button";
import {
  getPatientById,
  getProfileByUserId,
  getRoleById,
  getSampleById,
} from "@/db/queries/select";
import {
  CircleDashed,
  Clock,
  Contrast,
  Droplets,
  MoveUpLeft,
  Pencil,
  Search,
  SquareDashed,
  Sun,
  Type
} from "lucide-react";
import Image from "next/image";

export default async function ViewSamplePage({
  params,
}: {
  params: Promise<{ sampleId: string }>;
}) {
  const sampleId = (await params).sampleId;
  const sample = await getSampleById(sampleId);
  const patient = await getPatientById(sample.patientId);
  const profile = await getProfileByUserId(sample.uploadedBy);
  const role = await getRoleById(profile.roleId);

  return (
    <Base>
      <div className="flex h-full flex-1 gap-4 p-4">
        <Card
          key={sample.id}
          className="h-full min-w-40 gap-0 overflow-hidden p-0"
        >
          <CardFooter className="flex w-full flex-1 flex-col gap-2 overflow-hidden p-4">
            <div className="flex w-full justify-center gap-2 overflow-hidden">
              <UserButton
                imageUrl={patient.imageUrl || ""}
                firstName={patient.firstName}
                lastName={patient.lastName}
                redirectUrl={`/patients/${patient.id}`}
              />
              <UserButton
                imageUrl={profile.imageUrl || ""}
                firstName={profile.firstName}
                lastName={profile.lastName}
                redirectUrl={`/users/${profile.id}`}
              />
            </div>

            <div className="border-muted-foreground/20 flex w-full gap-1 rounded-md border p-1.5">
              {Object.entries(
                (sample.metadata as Record<string, unknown>) || {},
              ).map(([key, value]) => (
                <Card
                  key={key}
                  className="m-0 flex flex-1 justify-center gap-0 border-none p-0 shadow-none"
                >
                  <CardHeader className="m-0 flex flex-row items-center justify-center gap-0 p-0">
                    <CardTitle className="text-muted-foreground text-center text-[9px]">
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .trim()
                        .toUpperCase()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="m-0 gap-0 p-0">
                    <p className="truncate text-center text-xs font-medium">
                      {String(value)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-muted-foreground border-muted-foreground/20 bg-background top-2 right-2 flex w-full items-center justify-center gap-2 rounded-md border p-1.5 text-sm">
              <Clock className="h-3 w-3" />
              {sample.capturedAt ? sample.capturedAt.toLocaleString() : "N/A"}
            </div>
          </CardFooter>
        </Card>

        <div className="flex max-h-full flex-1 flex-col gap-4">
          <div className="relative border-muted-foreground/20 flex max-h-full flex-1 flex-col items-center justify-center overflow-hidden rounded-md border shadow-sm">
            <Image
              src={sample.imageUrl}
              alt={JSON.stringify(sample.metadata)}
              fill
              className="flex-1 object-cover"
            />
          </div>
          <Card
            className="flex flex-row flex-wrap w-full justify-between overflow-hidden px-4 py-2 rounded-lg"
          >
            <div className="flex flex-wrap gap-2">
              <Button variant={"outline"} disabled={true}>
                <Sun></Sun>
              </Button>
              <Button variant={"outline"} disabled={true}>
                <Contrast></Contrast>
              </Button>
              <Button variant={"outline"} disabled={true}>
                <Droplets></Droplets>
              </Button>
              <Button variant={"outline"} disabled={true}>
                <Pencil></Pencil>
              </Button>
              <Button variant={"outline"} disabled={true}>
                <Type></Type>
              </Button>
              <Button variant={"outline"} disabled={true}>
                <SquareDashed></SquareDashed>
              </Button>
              <Button variant={"outline"} disabled={true}>
                <CircleDashed></CircleDashed>
              </Button>
              <Button variant={"outline"} disabled={true}>
                <MoveUpLeft></MoveUpLeft>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <ShareDialog />
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 justify-start duration-200 ease-linear" disabled={true}>
                <Search></Search>
                Detect
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Base>
  );
}
