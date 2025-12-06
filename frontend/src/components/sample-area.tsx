"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SampleWithImage } from "@/db/schema";
import { useCurrentUserName } from "@/hooks/use-current-user-name";
import {
  CircleDashed,
  Contrast,
  Droplets,
  MoveUpLeft,
  Pencil,
  Search,
  SquareDashed,
  Sun,
  Type,
  BrainCircuit,
  FilePlus,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";
import { RealtimeCursors } from "./realtime-cursors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type SampleAreaProps = {
  sample: SampleWithImage;
  disabled?: boolean;
};

export default function SampleArea({ sample, disabled }: SampleAreaProps) {
  const [selectedModel, setSelectedModel] = useState(
    "parasite_detection_yolov8",
  );

  const [processedImageUrl, setProcessedImageUrl] = useState<string>(
    sample.imageUrl || "",
  );

  const [detectionResults, setDetectionResults] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);  
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const username = useCurrentUserName();
  const roomName = `sample_${String(sample.id)}`;

  async function handleProcessImage() {
    try {
      toast.loading("Sending image for prediction...");

      if (!sample.imageUrl) {
        throw new Error("No image URL available");
      }

      const imageBlob = await fetch(sample.imageUrl).then((res) => res.blob());
      const formData = new FormData();
      formData.append("file", imageBlob, "image.jpg");

      // Use the combined endpoint that runs detection once (through Next.js proxy)
      const endpoint = new URL('/api/detection/detect-and-analyze', window.location.origin);
      endpoint.searchParams.append('model_name', selectedModel);
      endpoint.searchParams.append('sample_type', 'Blood smear');
      endpoint.searchParams.append('stain', 'Giemsa');
      endpoint.searchParams.append('magnification', '1000x');

      const response = await fetch(endpoint.toString(), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || "Prediction failed");
      }

      const resultData = await response.json();
      
      if (resultData.success) {
        setDetectionResults({
          detections: resultData.detections,
          total_detections: resultData.total_detections,
          success: true
        });
        
        // Set AI analysis if available
        if (resultData.ai_analysis && resultData.ai_analysis.success) {
          setAiAnalysis(resultData.ai_analysis);
        }
        
        // Use processed image from base64 if available, otherwise fetch from predict endpoint
        if (resultData.processed_image_base64) {
          const resultUrl = `data:image/jpeg;base64,${resultData.processed_image_base64}`;
          setProcessedImageUrl(resultUrl);
        } else {
          // Fallback: Get the processed image from the predict endpoint
          const imageFormData = new FormData();
          imageFormData.append("file", imageBlob, "image.jpg");
          
          const predictEndpoint = new URL('/api/detection/predict', window.location.origin);
          predictEndpoint.searchParams.append('model_name', selectedModel);
          
          const imageResponse = await fetch(predictEndpoint.toString(), {
            method: "POST",
            body: imageFormData,
          });

          if (imageResponse.ok) {
            const blob = await imageResponse.blob();
            const resultUrl = URL.createObjectURL(blob);
            setProcessedImageUrl(resultUrl);
          }
        }

        toast.dismiss();
        toast.success("Detection and analysis complete!");
      } else {
        throw new Error(resultData.error || "Prediction failed");
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error("Prediction failed: " + error.message);
    }
  }

  async function handleAiAnalysis() {
    // This function is now redundant since AI analysis is done automatically
    // But keeping it for backward compatibility
    if (!sample.imageUrl || !detectionResults) {
      toast.error("Please run detection first");
      return;
    }

    toast.success("AI analysis is now performed automatically with detection!");
  }

  return (
    <div className="flex max-h-full flex-1 flex-col gap-0">
      <div className="border-muted-foreground/20 bg-muted-foreground/20 border-b-0.5 relative flex max-h-full flex-1 flex-col items-center justify-center overflow-hidden rounded-md rounded-b-none">
        <Image
          src={processedImageUrl}
          alt={JSON.stringify(sample.metadata)}
          fill
          className="flex-1 object-contain"
          priority
        />
        <RealtimeCursors roomName={roomName} username={username} />
      </div>
      <Card className="flex w-full flex-row flex-wrap justify-between gap-2 overflow-hidden rounded-lg rounded-t-none border border-t-1 p-2">
        <div className="flex flex-wrap gap-2">
          <Button variant={"outline"} disabled={disabled}>
            <Sun></Sun>
          </Button>
          <Button variant={"outline"} disabled={disabled}>
            <Contrast></Contrast>
          </Button>
          <Button variant={"outline"} disabled={disabled}>
            <Droplets></Droplets>
          </Button>
          <Button variant={"outline"} disabled={disabled}>
            <Pencil></Pencil>
          </Button>
          <Button variant={"outline"} disabled={disabled}>
            <Type></Type>
          </Button>
          <Button variant={"outline"} disabled={disabled}>
            <SquareDashed></SquareDashed>
          </Button>
          <Button variant={"outline"} disabled={disabled}>
            <CircleDashed></CircleDashed>
          </Button>
          <Button variant={"outline"} disabled={disabled}>
            <MoveUpLeft></MoveUpLeft>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-2">
            <Select
              disabled={disabled}
              onValueChange={setSelectedModel}
              value={selectedModel}
            >
              <SelectTrigger className="w-[180px]">
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
              onClick={handleProcessImage}
              disabled={disabled}
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 justify-start duration-200 ease-linear"
            >
              <Search></Search>
              Detect & Analyze
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Display detection results and AI analysis */}
      {(detectionResults || aiAnalysis) && (
        <Card className="mt-4 p-4">
          {detectionResults && (
            <div className="mb-4 p-4 bg-muted-foreground/10 rounded-lg shadow-sm flex flex-col gap-3">
              <h3 className="text-lg font-semibold mb-2">Detection Results</h3>
              <Button variant="default" className="w-fit flex items-center gap-2">
                <FilePlus className="w-4 h-4" />
                Create Report
              </Button>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Total Detections: {detectionResults.total_detections}</div>
                {Object.entries(detectionResults.detections).map(([class_name, count]) => (
                  <div key={class_name}>
                    {class_name}: {String(count)}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {aiAnalysis && (
            <div>
              <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
              <div className="whitespace-pre-wrap text-sm bg-muted-foreground/20 p-3 rounded">
                {String(aiAnalysis.analysis)}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
