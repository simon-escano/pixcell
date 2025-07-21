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
import React, { useState } from "react";
import ReactMarkdown from 'react-markdown';
import DetectionResultDialog from "@/components/DetectionResultDialog";

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

  // Detection state
  const [selectedModel, setSelectedModel] = useState<string>("parasite_detection_yolov8");
  const [detectionResults, setDetectionResults] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const [batchDetectionResults, setBatchDetectionResults] = useState<any>(null);
  const [batchAiAnalysis, setBatchAiAnalysis] = useState<any>(null);
  const [isBatchDetecting, setIsBatchDetecting] = useState(false);
  const [isBatchResultModalOpen, setIsBatchResultModalOpen] = useState(false);

  const handleDetect = async () => {
    if (!selectedSampleImage?.imageUrl) {
      toast.error("No image available for detection");
      return;
    }
    setIsDetecting(true);
    setDetectionResults(null);
    setAiAnalysis(null);
    setProcessedImageUrl(null);
    setIsResultModalOpen(false);
    try {
      toast.loading("Sending image for detection...");
      // Fetch the image as a blob
      const imageBlob = await fetch(selectedSampleImage.imageUrl).then((res) => res.blob());
      const formData = new FormData();
      formData.append("file", imageBlob, "image.jpg");
      // Call backend detection endpoint
      const response = await fetch(
        `http://127.0.0.1:8000/detect-and-analyze?model_name=${selectedModel}&sample_type=Blood%20smear&stain=Giemsa&magnification=1000x`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (!response.ok) throw new Error("Detection failed");
      const resultData = await response.json();
      if (resultData.success) {
        setDetectionResults({
          detections: resultData.detections,
          total_detections: resultData.total_detections,
          detection_details: resultData.detection_details,
        });
        if (resultData.ai_analysis && resultData.ai_analysis.success) {
          setAiAnalysis(resultData.ai_analysis);
        }
        // Set processed image from base64 if available
        if (resultData.processed_image_base64) {
          setProcessedImageUrl(`data:image/jpeg;base64,${resultData.processed_image_base64}`);
        }
        toast.dismiss();
        toast.success("Detection and analysis complete!");
        setIsResultModalOpen(true);
      } else {
        throw new Error(resultData.error || "Detection failed");
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error("Detection failed: " + error.message);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleBatchDetect = async () => {
    if (!sampleImages.length) {
      toast.error("No images in sample");
      return;
    }
    setIsBatchDetecting(true);
    setBatchDetectionResults(null);
    setBatchAiAnalysis(null);
    setIsBatchResultModalOpen(false);
    try {
      toast.loading("Sending all images for batch detection...");
      // Fetch all images as blobs
      const files: File[] = [];
      for (const img of sampleImages) {
        if (!img.imageUrl) continue;
        const blob = await fetch(img.imageUrl).then((res) => res.blob());
        files.push(new File([blob], "image.jpg", { type: blob.type }));
      }
      if (!files.length) throw new Error("No valid images to send");
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      // Call backend batch detection endpoint
      const response = await fetch(
        `http://127.0.0.1:8000/detect-and-analyze-batch?model_name=${selectedModel}&sample_type=Blood%20smear&stain=Giemsa&magnification=1000x`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (!response.ok) throw new Error("Batch detection failed");
      const resultData = await response.json();
      if (resultData.success) {
        setBatchDetectionResults({
          detections: resultData.total_counts,
          total_detections: resultData.total_detections,
          per_image: resultData.results,
        });
        if (resultData.ai_analysis && resultData.ai_analysis.success) {
          setBatchAiAnalysis(resultData.ai_analysis);
        }
        toast.dismiss();
        toast.success("Batch detection and analysis complete!");
        setIsBatchResultModalOpen(true);
      } else {
        throw new Error(resultData.error || "Batch detection failed");
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error("Batch detection failed: " + error.message);
    } finally {
      setIsBatchDetecting(false);
    }
  };

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
        {/* Detection Results Container - removed, now in modal */}
        {/* AI Analysis Container - removed, now in modal */}
        <div className="flex w-full items-center gap-2 p-2 border rounded-lg">
            <Select
              disabled={isDetecting || isBatchDetecting}
              onValueChange={setSelectedModel}
              value={selectedModel}
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
              onClick={handleDetect}
              disabled={isDetecting || isBatchDetecting}
            >
              <Search />
              {isDetecting ? "Detecting..." : "Detect"}
            </Button>
            <Button
              onClick={handleBatchDetect}
              disabled={isDetecting || isBatchDetecting}
              variant="secondary"
            >
              <Search />
              {isBatchDetecting ? "Detecting All..." : "Detect All in Sample"}
            </Button>
        </div>
        {/* Results Modal */}
        <DetectionResultDialog
          open={isResultModalOpen}
          onOpenChange={setIsResultModalOpen}
          detectionResults={detectionResults}
          aiAnalysis={aiAnalysis}
          processedImageUrl={processedImageUrl}
        />
        {/* Batch Results Modal */}
        <DetectionResultDialog
          open={isBatchResultModalOpen}
          onOpenChange={setIsBatchResultModalOpen}
          detectionResults={batchDetectionResults}
          aiAnalysis={batchAiAnalysis}
          processedImageUrl={null}
        />
      </div>
    </div>
  );
};

export default SamplePageWrapper;
