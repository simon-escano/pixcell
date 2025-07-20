"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import ProfileCard from "../../components/profile-card";
import { MetaSample, MetaSampleImage } from "../../types";
import SampleImageContainer from "./sample-image-container";
import { User } from "@supabase/supabase-js";

interface SamplePageWrapperProps {
  currentUser: User;
  sample: MetaSample | undefined;
  sampleImages: MetaSampleImage[];
  selectedSampleImageId: string;
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
  const sampleId = useParams().sampleId;

  return (
    <div className="flex h-screen w-full gap-4 p-6">
      <div className="flex-1 overflow-hidden rounded-md border">
        <SampleImageContainer
          currentUser={currentUser}
          sampleImage={selectedSampleImage!}
        />
      </div>
      <div className="flex h-full flex-col">
        <div className="flex flex-col overflow-hidden">
          <div className="flex flex-col gap-2 rounded-t-md border p-3">
          <h1 className="font-display px-1 text-lg lg:text-xl">
            {sample.sampleName}
          </h1>
          <div className="grid grid-cols-2 gap-2">
            <ProfileCard profile={sample.createdBy!} />
            <ProfileCard profile={sample.patient!} />
          </div>
        </div>
        <div className="mb-4 max-h-[300px] w-[300px] overflow-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="bg-primary text-primary-foreground flex w-[40px] cursor-pointer items-center justify-center rounded-sm py-1">
                    <PlusIcon className="size-4"></PlusIcon>
                  </div>
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
                );
              })}
            </TableBody>
          </Table>
        </div>
        </div>
        <div className="flex-1 rounded-md border"></div>
      </div>
    </div>
  );
};

export default SamplePageWrapper;
