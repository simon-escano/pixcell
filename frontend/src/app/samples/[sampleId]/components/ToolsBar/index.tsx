import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CircleDashed,
  MousePointer2,
  Pencil,
  Redo,
  SquareDashed,
  Undo,
} from "lucide-react";
import { CanvasMode, CanvasState, LayerType } from "../../../../../types";

type Props = {
  canvasState: CanvasState;
  setCanvasState: (newState: CanvasState) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

export default function ToolsBar({
  canvasState,
  setCanvasState,
  undo,
  redo,
  canUndo,
  canRedo,
}: Props) {
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
          >
            <MousePointer2 />
          </ToggleGroupItem>
          <ToggleGroupItem
            variant={"outline"}
            value="pencil"
            onClick={() => setCanvasState({ mode: CanvasMode.Pencil })}
          >
            <Pencil />
          </ToggleGroupItem>
          <ToggleGroupItem
            variant={"outline"}
            value="rectangle"
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
    </div>
  );
}
