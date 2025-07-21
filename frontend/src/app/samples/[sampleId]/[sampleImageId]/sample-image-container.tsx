import { User } from "@supabase/supabase-js";
import { MetaSampleImage } from "../../types";
import { Room } from "./liveblocks/Room";
import { StorageTldraw } from "./liveblocks/components/StorageTldraw";
import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface SampleImageContainerProps {
  currentUser: User;
  sampleImage: MetaSampleImage;
}

const SampleImageContainer = ({
  currentUser,
  sampleImage,
}: SampleImageContainerProps) => {
  // Log the current sample image URL
  console.log('Sample Image URL:', sampleImage.imageUrl);
  // Detection state
  const [selectedModel, setSelectedModel] = useState<string>("parasite_detection_yolov8");
  const [detectionResults, setDetectionResults] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);

  const handleDetect = async () => {
    if (!sampleImage.imageUrl) {
      alert("No image available for detection");
      return;
    }
    setIsDetecting(true);
    setDetectionResults(null);
    setAiAnalysis(null);
    setProcessedImageUrl(null);
    try {
      const imageBlob = await fetch(sampleImage.imageUrl).then((res) => res.blob());
      const formData = new FormData();
      formData.append("file", imageBlob, "image.jpg");
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
        if (resultData.processed_image_base64) {
          const processedUrl = `data:image/jpeg;base64,${resultData.processed_image_base64}`;
          setProcessedImageUrl(processedUrl);
        }
      } else {
        throw new Error(resultData.error || "Detection failed");
      }
    } catch (error: any) {
      alert("Detection failed: " + error.message);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 h-full w-full">
      {/* Image Display */}
      <Room roomId={"sample-image_" + sampleImage.id}>
        <StorageTldraw currentUser={currentUser} sampleImage={sampleImage} processedImageUrl={processedImageUrl} />
      </Room>
    </div>
  );
};

export default SampleImageContainer;
