"use client";

import { ShareDialog } from "@/components/share-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sample } from "@/db/schema";
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
  const [processedImageUrl, setProcessedImageUrl] = useState<string>(
    sample.imageUrl,
  );

  async function handleProcessImage() {
    try {
      toast.loading("Sending image for prediction...");

      const imageBlob = await fetch(sample.imageUrl).then((res) => res.blob());
      const formData = new FormData();
      formData.append("file", imageBlob, "image.jpg");

      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: formData,
      });

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
    <div className="flex max-h-full flex-1 flex-col gap-2">
      <div className="border-muted-foreground/20 bg-muted-foreground/20 relative flex max-h-full flex-1 flex-col items-center justify-center overflow-hidden rounded-md border shadow-sm">
        <Image
          src={processedImageUrl}
          alt={JSON.stringify(sample.metadata)}
          fill
          className="flex-1 object-contain"
        />
      </div>
      <Card className="flex w-full flex-row flex-wrap justify-between gap-2 overflow-hidden rounded-lg p-2">
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
          <Button
            onClick={handleProcessImage}
            disabled={disabled}
            className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 justify-start duration-200 ease-linear"
          >
            <Search></Search>
            Detect
          </Button>
        </div>
      </Card>
    </div>
  );
}
