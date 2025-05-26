import { Button } from "@/components/ui/button";
import { useMutation, useSelf } from "@liveblocks/react/suspense";
import { BringToFront, SendToBack, Trash } from "lucide-react";
import { memo } from "react";
import { Camera, Color } from "../../../../types";
import useDeleteLayers from "../../../../hooks/samples/use-delete-layers";
import useSelectionBounds from "../../../../hooks/samples/use-selection-bounds";
import ColorPicker from "./color-picker";

type SelectionToolsProps = {
  isAnimated: boolean;
  camera: Camera;
  setLastUsedColor: (color: Color) => void;
};

function SelectionTools({
  isAnimated,
  camera,
  setLastUsedColor,
}: SelectionToolsProps) {
  const selection = useSelf((me) => me.presence.selection);

  /**
   * Move all the selected layers to the front
   */
  const moveToFront = useMutation(
    ({ storage }) => {
      const liveLayerIds = storage.get("layerIds");
      const indices: number[] = [];

      const arr = liveLayerIds.toArray();

      for (let i = 0; i < arr.length; i++) {
        if (selection.includes(arr[i])) {
          indices.push(i);
        }
      }

      for (let i = indices.length - 1; i >= 0; i--) {
        liveLayerIds.move(
          indices[i],
          arr.length - 1 - (indices.length - 1 - i),
        );
      }
    },
    [selection],
  );

  /**
   * Move all the selected layers to the back
   */
  const moveToBack = useMutation(
    ({ storage }) => {
      const liveLayerIds = storage.get("layerIds");
      const indices: number[] = [];

      const arr = liveLayerIds.toArray();

      for (let i = 0; i < arr.length; i++) {
        if (selection.includes(arr[i])) {
          indices.push(i);
        }
      }

      for (let i = 0; i < indices.length; i++) {
        liveLayerIds.move(indices[i], i);
      }
    },
    [selection],
  );

  /**
   * Change the color of all the selected layers
   */
  const setFill = useMutation(
    ({ storage }, fill: Color) => {
      const liveLayers = storage.get("layers");
      setLastUsedColor(fill);
      selection.forEach((id) => {
        liveLayers.get(id)?.set("fill", fill);
      });
    },
    [selection, setLastUsedColor],
  );

  const deleteLayers = useDeleteLayers();

  const selectionBounds = useSelectionBounds();
  if (!selectionBounds) {
    return null;
  }

  const x = selectionBounds.width / 2 + selectionBounds.x + camera.x;
  const y = selectionBounds.y + camera.y;
  return (
    <div
      className="bg-card user-select-none absolute z-100 flex flex-row items-center gap-2 rounded-md border p-3 shadow-md"
      style={{
        transform: `translate(calc(${x}px - 50%), calc(${y - 16}px - 100%))`,
      }}
    >
      <ColorPicker onChange={setFill} />

      <div className="flex flex-col items-center">
        <Button onClick={moveToFront} variant={"ghost"} size={"sm"}>
          <BringToFront />
        </Button>
        <Button onClick={moveToBack} variant={"ghost"} size={"sm"}>
          <SendToBack />
        </Button>
      </div>
      <Button
        variant={"destructive"}
        onClick={deleteLayers}
        size={"icon"}
        className="bg-red-500/50"
      >
        <Trash />
      </Button>
    </div>
  );
}

export default memo(SelectionTools);
