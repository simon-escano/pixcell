"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Ellipsis, PlusIcon, Search } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import ProfileCard from "../../components/profile-card";
import { MetaSample, MetaSampleImage } from "../../types";
import SampleImageContainer from "./sample-image-container";
import { User } from "@supabase/supabase-js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { handleCopySampleId, handleDeleteSample } from "../../components/sample-card";
import SampleDrawer from "@/components/samples/upload-sample-drawer";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import toast from "react-hot-toast";

interface SamplePageWrapperProps {
  currentUser: User;
  sample: MetaSample | undefined;
  sampleImages: MetaSampleImage[];
  selectedSampleImageId: string;
}

async function handleDeleteSampleImage(sampleImageId: string, sampleId: string, router: any) {
  const toastId = toast.loading("Deleting sample image...");
  try {
    const { deleteSampleImage } = await import("@/actions/samples");
    const res = await deleteSampleImage(sampleImageId);
    if (res.success) {
      toast.success("Sample image deleted", { id: toastId });
      router.push(`/samples/${sampleId}`);
    } else {
      toast.error(res.error || "Failed to delete sample image", { id: toastId });
    }
  } catch (e) {
    toast.error("Failed to delete sample image", { id: toastId });
  }
}

const SamplePageWrapper = ({
  currentUser,
  sample,
  sampleImages,
  selectedSampleImageId,
}: SamplePageWrapperProps) => {
  const selectedSampleImage =
    sampleImages.find((img) => img.id === selectedSampleImageId) ||
    sampleImages[0];
  const router = useRouter();
  sample = sample!;
  const sampleId = useParams()?.sampleId;

  return (
    <div className="flex h-full w-full gap-4 p-6">
      <div className="flex-1 overflow-hidden rounded-md border">
        <SampleImageContainer
          currentUser={currentUser}
          sampleImage={selectedSampleImage!}
        />
      </div>
      <div className="flex h-full flex-col w-[300px]">
        <div className="flex flex-col max-h-[300px] overflow-hidden mb-4 rounded-md border">
          <div className="flex flex-col gap-2 p-3">
          <div className="flex items-center">
            <h1 className="font-display px-1 text-lg lg:text-xl mr-4 flex-1">
              {sample.sampleName}
            </h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={"ghost"} className="cursor-pointer">
                  <Ellipsis className="text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {
                  handleCopySampleId(sample)
                }}>
                  Copy Sample ID
                </DropdownMenuItem>
                {(currentUser.id == sample.createdBy?.id || currentUser.role == "Administrator") ? <DropdownMenuItem
                    className="text-red-500 hover:text-red-700"
                    onClick={() => {
                      handleDeleteSample(sample, router)
                    }}
                  >
                  Delete Sample
                </DropdownMenuItem> : ""}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ProfileCard profile={sample.createdBy!} />
            <ProfileCard profile={sample.patient!} />
          </div>
        </div>
        <div className="h-full overflow-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SampleDrawer sample={sample} patient={sample.patient} patients={[sample.patient]}>
                    <div className="bg-primary text-primary-foreground flex w-[40px] cursor-pointer items-center justify-center rounded-sm py-1">
                      <PlusIcon className="size-4"></PlusIcon>
                    </div>
                  </SampleDrawer>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Width</TableHead>
                <TableHead>Height</TableHead>
                <TableHead>Captured At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleImages.map((sampleImage) => {
                return (
                  <ContextMenu key={sampleImage.id}>
                    <ContextMenuTrigger asChild>
                      <TableRow
                        key={sampleImage.id}
                        className={`cursor-pointer ${sampleImage.id == selectedSampleImage.id ? "bg-border" : ""}`}
                        onClick={() => {
                          router.push(`/samples/${sampleId}/${sampleImage.id}`);
                        }}
                      >
                        <TableCell>
                          <img
                            className="h-[40px] rounded-sm object-cover"
                            src={sampleImage.imageUrl!}
                          />
                        </TableCell>
                        <TableCell>{sampleImage.metadata.type}</TableCell>
                        <TableCell>{sampleImage.metadata.width}</TableCell>
                        <TableCell>{sampleImage.metadata.height}</TableCell>
                        <TableCell>{sampleImage.capturedAt}</TableCell>
                      </TableRow>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        onClick={async () => {
                          await navigator.clipboard.writeText(sampleImage.id);
                          toast.success("Sample image ID copied");
                        }}
                      >
                        Copy Sample Image ID
                      </ContextMenuItem>
                      <ContextMenuItem
                        className="text-red-500 focus:text-red-700"
                        onClick={async () => {
                          await handleDeleteSampleImage(sampleImage.id, sample.id, router);
                        }}
                      >
                        Delete Sample Image
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </TableBody>
          </Table>
        </div>
        </div>
        <div className="flex-1 rounded-md mb-4 border">
        </div>
        <div className="flex w-full items-center gap-2 p-2 border rounded-lg">
            <Select
              disabled={false}
              onValueChange={undefined}
              value={undefined}
            >
              <SelectTrigger className="h-full flex-1">
                <SelectValue placeholder="Choose model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parasite_detection_yolov8">
                  Parasite Detection
                </SelectItem>
                <SelectItem value="anemia_detection_yolov8">
                  Anemia Detection
                </SelectItem>
                <SelectItem value="malaria_detection_yolov8">
                  Malaria Detection
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={undefined}
            >
              <Search />
              Detect
            </Button>
        </div>
      </div>
    </div>
  );
};

export default SamplePageWrapper;
