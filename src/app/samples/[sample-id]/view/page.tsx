import Base from "@/components/base";
import { ShareDialog } from "@/components/share-dialog";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
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
import { AvatarFallback } from "@radix-ui/react-avatar";
import { Separator } from "@radix-ui/react-separator";
import {
  CircleDashed,
  Clock,
  Contrast,
  Droplets,
  Forward,
  MoveUpLeft,
  Pencil,
  Search,
  SquareDashed,
  Sun,
  Type,
} from "lucide-react";

export default async function ViewSamplePage({
  params,
}: {
  params: { "sample-id": string };
}) {
  const sample = (await getSampleById(params["sample-id"]))[0];
  const patient = (await getPatientById(sample.patientId))[0];
  const profile = (await getProfileByUserId(sample.uploadedBy))[0];
  const role = (await getRoleById(profile.roleId))[0];
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
          <div className="border-muted-foreground/20 flex max-h-full flex-1 flex-col items-center justify-center overflow-hidden rounded-md border shadow-sm">
            <img
              src={sample.imageUrl}
              alt={JSON.stringify(sample.metadata)}
              className="flex-1 object-cover"
            />
          </div>
          <Button
            variant={"outline"}
            className="hover:bg-background flex h-auto w-full flex-wrap justify-between overflow-hidden"
            disabled={true}
          >
            <div className="flex flex-wrap gap-2">
              <Button variant={"outline"}>
                <Sun></Sun>
              </Button>
              <Button variant={"outline"}>
                <Contrast></Contrast>
              </Button>
              <Button variant={"outline"}>
                <Droplets></Droplets>
              </Button>
              <Button variant={"outline"}>
                <Pencil></Pencil>
              </Button>
              <Button variant={"outline"}>
                <Type></Type>
              </Button>
              <Button variant={"outline"}>
                <SquareDashed></SquareDashed>
              </Button>
              <Button variant={"outline"}>
                <CircleDashed></CircleDashed>
              </Button>
              <Button variant={"outline"}>
                <MoveUpLeft></MoveUpLeft>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <ShareDialog />
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 justify-start duration-200 ease-linear">
                <Search></Search>
                Detect
              </Button>
            </div>
          </Button>
        </div>
      </div>
    </Base>
  );
}
