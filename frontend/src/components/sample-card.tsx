"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Patient, Profile, Role, Sample } from "@/db/schema";
import { formatTime } from "@/lib/utils";
import { Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import UserButton from "./user-button";
import { useEffect, useState } from "react";
import Image from "next/image";

function SampleCard({
  patient,
  sample,
  profile,
  role,
}: {
  patient: Patient;
  sample: Sample;
  profile: Profile;
  role: Role;
}) {
  const router = useRouter();

  const [formattedTime, setFormattedTime] = useState("");

  useEffect(() => {
    if (sample.capturedAt) {
      setFormattedTime(formatTime(sample.capturedAt.toISOString()));
    }
  }, [sample.capturedAt]);

  return (
    <Card
      key={sample.id}
      className="relative cursor-pointer gap-0 overflow-hidden p-0"
      onClick={() => {
        router.push(`/samples/${sample.id}`);
      }}
    >
      <CardHeader className="overflow-hidden p-0">
        <div className="relative h-40 w-full overflow-hidden">
          <Image 
            src={sample.imageUrl || ""}
            alt="Sample Image"
            fill
            className="h-full w-full object-cover" />
        </div>
      </CardHeader>
      <CardFooter className="flex w-full flex-1 flex-col gap-2 overflow-hidden p-4">
        <div className="text-muted-foreground border-muted-foreground/20 bg-background absolute top-2 right-2 flex items-center justify-center gap-2 rounded-md border p-1.5 text-sm">
          <Clock className="h-3 w-3" />
          {formattedTime || "N/A"}
        </div>
        <div className="flex w-full flex-1 gap-2 overflow-hidden">
          <UserButton
            imageUrl={patient.imageUrl || ""}
            firstName={patient.firstName}
            lastName={patient.lastName}
          />
          <UserButton
            imageUrl={profile.imageUrl || ""}
            firstName={profile.firstName}
            lastName={profile.lastName}
            roleName={role.name}
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
      </CardFooter>
    </Card>
  );
}

export default SampleCard;
