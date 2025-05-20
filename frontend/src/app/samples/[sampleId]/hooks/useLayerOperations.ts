import { Color, LayerType, Point, Side, XYWH } from "@/types";
import { LiveObject } from "@liveblocks/client";
import { useMutation } from "@liveblocks/react/suspense";
import { nanoid } from "nanoid";
import { useCallback } from "react";
import { penPointsToPathLayer, resizeBounds } from "../utils";

const MAX_LAYERS = 100;

export const useLayerOperations = (
  lastUsedColor: Color,
  setCanvasMode: (mode: any) => void,
  setTranslatingMode: (point: Point) => void,
  setResizingMode: (bounds: XYWH, corner: Side) => void,
) => {
  const insertLayer = useMutation(
    (
      { storage, setMyPresence },
      layerType: LayerType.Ellipse | LayerType.Rectangle,
      position: Point,
    ) => {
      const liveLayers = storage.get("layers");
      if (liveLayers.size >= MAX_LAYERS) return;

      const liveLayerIds = storage.get("layerIds");
      const layerId = nanoid();
      const layer = new LiveObject({
        type: layerType,
        x: position.x,
        y: position.y,
        height: 100,
        width: 100,
        fill: lastUsedColor,
      });
      liveLayerIds.push(layerId);
      liveLayers.set(layerId, layer);

      setMyPresence({ selection: [layerId] }, { addToHistory: true });
      setCanvasMode("None");
    },
    [lastUsedColor, setCanvasMode],
  );

  const insertPath = useMutation(
    ({ storage, self, setMyPresence }) => {
      const liveLayers = storage.get("layers");
      const { pencilDraft } = self.presence;
      if (
        pencilDraft == null ||
        pencilDraft.length < 2 ||
        liveLayers.size >= MAX_LAYERS
      ) {
        setMyPresence({ pencilDraft: null });
        return;
      }

      const id = nanoid();
      liveLayers.set(
        id,
        new LiveObject(penPointsToPathLayer(pencilDraft, lastUsedColor)),
      );

      const liveLayerIds = storage.get("layerIds");
      liveLayerIds.push(id);
      setMyPresence({ pencilDraft: null });
      setCanvasMode("Pencil");
    },
    [lastUsedColor, setCanvasMode],
  );

  const translateSelectedLayers = useMutation(
    ({ storage, self }, point: Point, currentPoint: Point) => {
      const offset = {
        x: point.x - currentPoint.x,
        y: point.y - currentPoint.y,
      };

      const liveLayers = storage.get("layers");
      for (const id of self.presence.selection) {
        const layer = liveLayers.get(id);
        if (layer) {
          layer.update({
            x: layer.get("x") + offset.x,
            y: layer.get("y") + offset.y,
          });
        }
      }

      setTranslatingMode(point);
    },
    [setTranslatingMode],
  );

  const resizeSelectedLayer = useMutation(
    ({ storage, self }, point: Point, initialBounds: XYWH, corner: Side) => {
      const bounds = resizeBounds(initialBounds, corner, point);
      const liveLayers = storage.get("layers");
      const layer = liveLayers.get(self.presence.selection[0]);
      if (layer) {
        layer.update(bounds);
      }
    },
    [],
  );

  const onResizeHandlePointerDown = useCallback(
    (corner: Side, initialBounds: XYWH) => {
      setResizingMode(initialBounds, corner);
    },
    [setResizingMode],
  );

  return {
    insertLayer,
    insertPath,
    translateSelectedLayers,
    resizeSelectedLayer,
    onResizeHandlePointerDown,
  };
}; 