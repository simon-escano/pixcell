import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CanvasMode, LayerType } from "@/types";
import {
  CircleDashed,
  Contrast,
  MousePointer2,
  Pencil,
  Redo,
  Search,
  SquareDashed,
  Sun,
  Undo
} from "lucide-react";

interface ToolbarProps {
  canvasMode: CanvasMode;
  setCanvasMode: (mode: CanvasMode) => void;
  setInsertingMode: (layerType: LayerType.Rectangle | LayerType.Ellipse) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  onProcessImage: () => void;
  disabled?: boolean;
}

export const Toolbar = ({
  canvasMode,
  setCanvasMode,
  setInsertingMode,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  selectedModel,
  setSelectedModel,
  onProcessImage,
  disabled,
}: ToolbarProps) => {
  return (
    <div className="bg-background border-muted-foreground/20 pointer-events-auto flex items-center flex-wrap justify-between gap-4 rounded-lg rounded-t-none border p-2">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center">
          <ToggleGroup
            type="single"
            variant={"outline"}
            className="flex flex-wrap gap-2"
            size={"lg"}
          >
            <ToggleGroupItem
              value="brightness"
              variant={"outline"}
              disabled={disabled}
            >
              <Sun></Sun>
            </ToggleGroupItem>
            <ToggleGroupItem
              variant={"outline"}
              value="contrast"
              disabled={disabled}
            >
              <Contrast></Contrast>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="bg-foreground/10 w-px self-stretch"></div>
        <div className="flex flex-wrap items-center">
          <ToggleGroup
            type="single"
            variant={"outline"}
            className="flex flex-wrap gap-2"
            size={"lg"}
          >
            <ToggleGroupItem
              value="select"
              variant={"outline"}
              onClick={() => setCanvasMode(CanvasMode.None)}
              disabled={disabled}
            >
              <MousePointer2 />
            </ToggleGroupItem>
            <ToggleGroupItem
              variant={"outline"}
              value="pencil"
              onClick={() => setCanvasMode(CanvasMode.Pencil)}
              disabled={disabled}
            >
              <Pencil />
            </ToggleGroupItem>
            <ToggleGroupItem
              variant={"outline"}
              value="rectangle"
              disabled={disabled}
              onClick={() => setInsertingMode(LayerType.Rectangle)}
            >
              <SquareDashed />
            </ToggleGroupItem>
            <ToggleGroupItem
              variant={"outline"}
              value="circle"
              disabled={disabled}
              onClick={() => setInsertingMode(LayerType.Ellipse)}
            >
              <CircleDashed />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="bg-foreground/10 w-px self-stretch"></div>
        <div className="flex flex-wrap items-center gap-2 self-stretch">
          <Button
            variant={"outline"}
            onClick={onUndo}
            disabled={!canUndo}
            className="h-full"
          >
            <Undo />
          </Button>
          <Button
            variant={"outline"}
            onClick={onRedo}
            disabled={!canRedo}
            className="h-full"
          >
            <Redo />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          disabled={disabled}
          onValueChange={setSelectedModel}
          value={selectedModel}
        >
          <SelectTrigger className="h-full w-[180px]">
            <SelectValue placeholder="Choose model" className="h-full" />
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
          onClick={onProcessImage}
          disabled={disabled}
        >
          <Search />
          Detect
        </Button>
      </div>
    </div>
  );
}; 