import { Point } from "@/types";
import { useMutation } from "@liveblocks/react/suspense";
import { useCallback } from "react";
import { findIntersectingLayersWithRectangle } from "../../utils";

export const useSelection = (
  layerIds: readonly string[],
  setSelectionNetMode: (origin: Point, current: Point) => void,
) => {
  const startMultiSelection = useCallback((current: Point, origin: Point) => {
    if (Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) > 5) {
      setSelectionNetMode(origin, current);
    }
  }, [setSelectionNetMode]);

  const updateSelectionNet = useMutation(
    ({ storage, setMyPresence }, current: Point, origin: Point) => {
      const layers = storage.get("layers").toImmutable();
      setSelectionNetMode(origin, current);
      const ids = findIntersectingLayersWithRectangle(
        layerIds,
        layers,
        origin,
        current,
      );
      setMyPresence({ selection: ids });
    },
    [layerIds, setSelectionNetMode],
  );

  const unselectLayers = useMutation(({ self, setMyPresence }) => {
    if (self.presence.selection.length > 0) {
      setMyPresence({ selection: [] }, { addToHistory: true });
    }
  }, []);

  return {
    startMultiSelection,
    updateSelectionNet,
    unselectLayers,
  };
}; 