import { CanvasMode, CanvasState, LayerType, Point, Side, XYWH } from "@/types";
import { useCallback, useState } from "react";

export const useCanvasState = () => {
  const [canvasState, setState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });

  const setCanvasMode = useCallback((mode: CanvasMode) => {
    setState({ mode } as CanvasState);
  }, []);

  const setInsertingMode = useCallback((layerType: LayerType.Rectangle | LayerType.Ellipse) => {
    setState({
      mode: CanvasMode.Inserting,
      layerType,
    });
  }, []);

  const setPressingMode = useCallback((origin: Point) => {
    setState({ origin, mode: CanvasMode.Pressing });
  }, []);

  const setSelectionNetMode = useCallback((origin: Point, current: Point) => {
    setState({
      mode: CanvasMode.SelectionNet,
      origin,
      current,
    });
  }, []);

  const setTranslatingMode = useCallback((current: Point) => {
    setState({ mode: CanvasMode.Translating, current });
  }, []);

  const setResizingMode = useCallback((initialBounds: XYWH, corner: Side) => {
    setState({
      mode: CanvasMode.Resizing,
      initialBounds,
      corner,
    });
  }, []);

  return {
    canvasState,
    setCanvasMode,
    setInsertingMode,
    setPressingMode,
    setSelectionNetMode,
    setTranslatingMode,
    setResizingMode,
  };
}; 