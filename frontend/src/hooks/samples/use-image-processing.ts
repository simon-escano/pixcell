import { useState } from "react";
import toast from "react-hot-toast";

export const useImageProcessing = (initialImageUrl: string) => {
  const [processedImageUrl, setProcessedImageUrl] = useState<string>(initialImageUrl);
  const [selectedModel, setSelectedModel] = useState("parasite_detection_yolov8");

  const handleProcessImage = async () => {
    try {
      toast.loading("Sending image for prediction...");

      const imageBlob = await fetch(initialImageUrl).then((res) => res.blob());
      const formData = new FormData();
      formData.append("file", imageBlob, "image.jpg");

      const response = await fetch(
        `http://127.0.0.1:8000/predict?model_name=${selectedModel}`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) throw new Error("Prediction failed");

      const blob = await response.blob();
      const resultUrl = URL.createObjectURL(blob);
      setProcessedImageUrl(resultUrl);

      toast.dismiss();
      toast.success("Prediction complete!");
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
  };
}; 