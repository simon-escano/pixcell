import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CircleDashed,
  MousePointer2,
  Pencil,
  Redo,
  Search,
  SquareDashed,
  Undo,
} from "lucide-react";
import { CanvasMode, CanvasState, LayerType } from "../../../../../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import { Sample } from "@/db/schema";
import { useState } from "react";

type Props = {
  canvasState: CanvasState;
  setCanvasState: (newState: CanvasState) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  sample: Sample;
  disabled?: boolean;
};

export default function ToolsBar({
  canvasState,
  setCanvasState,
  undo,
  redo,
  canUndo,
  canRedo,
  sample,
  disabled,
}: Props) {
  const [selectedModel, setSelectedModel] = useState(
    "parasite_detection_yolov8",
  );

  const [processedImageUrl, setProcessedImageUrl] = useState<string>(
    sample.imageUrl,
  );

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
    <div className="bg-background border-muted-foreground/20 pointer-events-auto flex items-center justify-center rounded-lg rounded-t-none border">
      <div className="flex items-center justify-center p-2">
        <ToggleGroup
          type="single"
          variant={"outline"}
          className="gap-2"
          size={"lg"}
        >
          <ToggleGroupItem
            value="select"
            variant={"outline"}
            onClick={() => setCanvasState({ mode: CanvasMode.None })}
            disabled={disabled}
          >
            <MousePointer2 />
          </ToggleGroupItem>
          <ToggleGroupItem
            variant={"outline"}
            value="pencil"
            onClick={() => setCanvasState({ mode: CanvasMode.Pencil })}
            disabled={disabled}
          >
            <Pencil />
          </ToggleGroupItem>
          <ToggleGroupItem
            variant={"outline"}
            value="rectangle"
            disabled={disabled}
            onClick={() =>
              setCanvasState({
                mode: CanvasMode.Inserting,
                layerType: LayerType.Rectangle,
              })
            }
          >
            <SquareDashed />
          </ToggleGroupItem>
          <ToggleGroupItem
            variant={"outline"}
            value="circle"
            disabled={disabled}
            onClick={() =>
              setCanvasState({
                mode: CanvasMode.Inserting,
                layerType: LayerType.Ellipse,
              })
            }
          >
            <CircleDashed />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="bg-foreground/10 w-px self-stretch"></div>
      <div className="flex items-center justify-center gap-2 self-stretch p-2">
        <Button
          variant={"outline"}
          onClick={undo}
          disabled={!canUndo}
          className="h-full"
        >
          <Undo />
        </Button>
        <Button
          variant={"outline"}
          onClick={redo}
          disabled={!canRedo}
          className="h-full"
        >
          <Redo />
        </Button>
      </div>
      <div className="flex h-full items-center gap-2 p-3">
        <Select
          disabled={disabled}
          onValueChange={setSelectedModel}
          value={selectedModel}
        >
          <SelectTrigger className="h-full w-[180px]">
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
          className="h-full"
        >
          <Search></Search>
          Detect
        </Button>
      </div>
    </div>
  );
}
