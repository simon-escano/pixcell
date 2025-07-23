"use client";

import { deleteSample } from "@/actions/samples";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { CircleOff } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { MetaProfile, MetaSample, MetaSampleImage } from "../../app/samples/types";
import ProfileCard from "./profile-card";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useEffect } from "react";

export const handleCopySampleId = (sample: MetaSample) => {
    navigator.clipboard.writeText(sample.id);
    toast.success("Sample ID copied to clipboard");
  };

export const handleDeleteSample = async (sample: MetaSample, router: AppRouterInstance) => {
  const loadingToast = toast.loading("Deleting sample...");
  
  try {
    const res = await deleteSample(sample.id);
    
    // Dismiss the loading toast
    toast.dismiss(loadingToast);
    
    if (res.success) {
      toast.success("Sample deleted successfully");
      router.push("/samples");
    } else {
      toast.error(res.error || "Failed to delete sample");
    }
  } catch (error) {
    // Dismiss the loading toast in case of error
    toast.dismiss(loadingToast);
    toast.error("Failed to delete sample");
  }
};


interface SampleCardProps {
  currentUser: MetaProfile
  sample: MetaSample;
  sampleImages: MetaSampleImage[];
}

const SampleCard = ({ currentUser, sample, sampleImages }: SampleCardProps) => {
  // Prefetch images in browser cache
  useEffect(() => {
    sampleImages.forEach(img => {
      if (img.imageUrl && img.imageUrl !== "/placeholder.svg") {
        const image = new window.Image();
        image.src = img.imageUrl;
      }
    });
  }, [sampleImages]);

  // Get all images we need to display (max 3)
  const displayImages = sampleImages.slice(0, 3);
  const remainingCount = Math.max(0, sampleImages.length - 3);
  const router = useRouter();

  // Fetch all images at once
  const renderImageGrid = () => {
    const imageCount = sampleImages.length;

    if (imageCount === 0) {
      return (
        <div className="bg-muted flex h-40 items-center justify-center rounded-sm border">
          <CircleOff className="text-muted-foreground" />
        </div>
      );
    }

    if (imageCount === 1) {
      // Single image: 1 column, 1 row
      return (
        <div className="h-40 overflow-hidden rounded-sm border">
          <img
            className="h-full w-full object-cover"
            src={displayImages[0].imageUrl! || "/placeholder.svg"}
            alt={displayImages[0].imageUrl!}
          />
        </div>
      );
    }

    if (imageCount === 2) {
      // Two images: 2 columns, 1 row
      return (
        <div className="grid h-40 grid-cols-2 gap-0.5 overflow-hidden rounded-sm border">
          {displayImages.map((image, index) => (
            <img
              key={index}
              className="h-full object-cover"
              src={image.imageUrl! || "/placeholder.svg"}
              alt={image.imageUrl!}
            />
          ))}
        </div>
      );
    }

    // Three or more images: Fibonacci-style layout
    return (
      <div className="grid h-40 grid-cols-2 gap-0.5 overflow-hidden rounded-sm border">
        {/* First image takes the left column */}
        <img
          className="h-full object-cover"
          src={displayImages[0].imageUrl! || "/placeholder.svg"}
          alt={displayImages[0].imageUrl!}
        />

        {/* Right column: nested grid with 2 rows */}
        <div className="grid h-40 grid-rows-2 gap-0.5">
          {/* Second image: top right */}
          <img
            className="h-full w-full object-cover"
            src={displayImages[1].imageUrl! || "/placeholder.svg"}
            alt={displayImages[1].imageUrl!}
          />

          {/* Third image: bottom right with overlay if there are more images */}
          <div className="relative">
            <img
              className="h-full w-full object-cover"
              src={displayImages[2].imageUrl! || "/placeholder.svg"}
              alt={displayImages[2].imageUrl!}
            />
            {remainingCount > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <span className="text-lg font-semibold text-white">
                  +{remainingCount}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <ContextMenu>
    <ContextMenuTrigger>
      <div
        onClick={() => {
          router.push(`/samples/${sample.id}${sampleImages.length ? `/${sampleImages[0].id}` : ""}`);
        }}
        className="bg-card flex cursor-pointer flex-col overflow-hidden rounded-md border transition-shadow hover:shadow-lg"
      >
        <div className="p-2 pb-0">{renderImageGrid()}</div>
        <div className="flex flex-col gap-2 p-3">
          <h1 className="font-display truncate px-1 text-lg lg:text-xl">
            {sample.sampleName}
          </h1>
          <div className="grid grid-cols-2 gap-2">
            <ProfileCard profile={sample.createdBy!} />
            <ProfileCard profile={sample.patient!} />
          </div>
        </div>
      </div>
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuItem onClick={() => {
        handleCopySampleId(sample)
      }}>
        Copy Sample ID
      </ContextMenuItem>
      {(currentUser.id == sample.createdBy?.id || currentUser.role == "Administrator") ? <ContextMenuItem
          className="text-red-500 hover:text-red-700"
          onClick={() => {
            handleDeleteSample(sample, router)
          }}
        >
        Delete Sample
      </ContextMenuItem> : ""}
    </ContextMenuContent>
  </ContextMenu>
  );
};

export default SampleCard;