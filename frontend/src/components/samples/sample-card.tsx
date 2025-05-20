"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import UserButton from "../users/user-button";
import { toast } from "react-hot-toast";
import { deleteSample } from "@/actions/samples";

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

  const handleCopySampleId = () => {
    navigator.clipboard.writeText(sample.id);
    toast.success("Sample ID copied to clipboard");
  };

  const handleEditSample = () => {
    router.push(`/samples/${sample.id}/edit`);
  };

  const handleDeleteSample = async () => {
    const res = await deleteSample(sample.id);
    if (res.success) {
      toast.success("Sample deleted successfully");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete sample");
    }
  };

  const handlePatientClick = async (e: React.MouseEvent) => {
    // No need for e.stopPropagation() as it's handled in the UserButton component
    router.push(`/patients/${patient.id}`);
  };

  const handleProfileClick = async (e: React.MouseEvent) => {
    // No need for e.stopPropagation() as it's handled in the UserButton component
    if (profile.userId) {
      router.push(`/users/${profile.userId}`);
    } else {
      toast.error("User not found");
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
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
                className="h-full w-full object-cover"
              />
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
                onClick={handlePatientClick}
                redirectUrl={`/patients/${patient.id}`}
              />
              <UserButton
                imageUrl={profile.imageUrl || ""}
                firstName={profile.firstName}
                lastName={profile.lastName}
                roleName={role.name}
                onClick={handleProfileClick}
                redirectUrl={
                  profile.userId ? `/users/${profile.userId}` : undefined
                }
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
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleCopySampleId}>
          Copy Sample ID
        </ContextMenuItem>
        <ContextMenuItem onClick={handleEditSample}>
          Edit Sample
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-red-500 hover:text-red-700"
          onClick={handleDeleteSample}
        >
          Delete Sample
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default SampleCard;
