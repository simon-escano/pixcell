import { useState } from "react";
import toast from "react-hot-toast";

interface DetectionResult {
  detections: any[];
  total_detections: number;
  success: boolean;
}

interface AiAnalysis {
  success: boolean;
  findings: any;
  [key: string]: any;
}

export const useImageProcessing = (initialImageUrl: string) => {
  const [processedImageUrl, setProcessedImageUrl] = useState<string>(initialImageUrl);
  const [selectedModel, setSelectedModel] = useState("parasite_detection_yolov8");
  const [detectionResults, setDetectionResults] = useState<DetectionResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);

  const handleProcessImage = async () => {
    try {
      toast.loading("Sending image for prediction...");

      if (!initialImageUrl) {
        throw new Error("No image URL available");
      }

      const imageBlob = await fetch(initialImageUrl).then((res) => res.blob());
      const formData = new FormData();
      formData.append("file", imageBlob, "image.jpg");

      // Use the combined endpoint that runs detection once
      const response = await fetch(
        `http://127.0.0.1:8000/detect-and-analyze?model_name=${selectedModel}&sample_type=Blood%20smear&stain=Giemsa&magnification=1000x`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) throw new Error("Prediction failed");

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
        
        // Get the processed image from the original predict endpoint for display
        const imageFormData = new FormData();
        imageFormData.append("file", imageBlob, "image.jpg");
        
        const imageResponse = await fetch(
          `http://127.0.0.1:8000/predict?model_name=${selectedModel}`,
          {
            method: "POST",
            body: imageFormData,
          },
        );

        if (imageResponse.ok) {
          const blob = await imageResponse.blob();
          const resultUrl = URL.createObjectURL(blob);
          setProcessedImageUrl(resultUrl);
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
  };

  return {
    processedImageUrl,
    selectedModel,
    setSelectedModel,
    handleProcessImage,
    detectionResults,
    aiAnalysis,
  };
}; 