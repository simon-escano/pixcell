"use client";

import { RealtimeCursors } from "@/components/realtime-cursors";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sample } from "@/db/schema";
import { useCurrentUserName } from "@/hooks/use-current-user-name";
import { useOthers } from "@liveblocks/react";
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
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";

type SampleAreaProps = {
  sample: Sample;
  disabled?: boolean;
};

export default function SampleArea({ sample, disabled }: SampleAreaProps) {
  const [selectedModel, setSelectedModel] = useState(
    "parasite_detection_yolov8",
  );

  const [processedImageUrl, setProcessedImageUrl] = useState<string>(
    sample.imageUrl,
  );

  const username = useCurrentUserName();
  const roomName = `sample_${String(sample.id)}`;
  const others = useOthers();

  async function handleProcessImage() {
    try {
      toast.loading("Sending image for prediction...");

      const imageBlob = await fetch(sample.imageUrl).then((res) => res.blob());
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
  }

  return (
    <div className="flex max-h-full flex-1 flex-col gap-0">
      <div className="border-muted-foreground/20 bg-muted-foreground/20 border-b-0.5 relative flex max-h-full flex-1 flex-col items-center justify-center overflow-hidden rounded-md rounded-b-none">
        <Image
          src={processedImageUrl}
          alt={JSON.stringify(sample.metadata)}
          fill
          className="flex-1 object-contain"
        />
        <RealtimeCursors roomName={roomName} username={username} />
      </div>
      <Card className="flex w-full flex-row flex-wrap justify-between gap-2 overflow-hidden rounded-lg rounded-t-none border border-t-1 p-2">
        <div className="flex flex-wrap gap-2">
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
              Detect
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
