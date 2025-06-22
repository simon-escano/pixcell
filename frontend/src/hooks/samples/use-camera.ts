import { Camera } from "@/types";
import { useCallback, useEffect, useState } from "react";

export const useCamera = (canvasRef: React.RefObject<SVGSVGElement | null>) => {
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });
  const [isMiddleButtonDown, setIsMiddleButtonDown] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    setCamera({
      x: rect.width / 2,
      y: rect.height / 2,
    });
  }, [canvasRef]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    setCamera((camera) => ({
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY,
    }));
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (isMiddleButtonDown) {
      setCamera((camera) => ({
        x: camera.x + e.movementX,
        y: camera.y + e.movementY,
      }));
    }
  }, [isMiddleButtonDown]);

  const setMiddleButtonState = useCallback((isDown: boolean) => {
    setIsMiddleButtonDown(isDown);
  }, []);

  return {
    camera,
    isMiddleButtonDown,
    onWheel,
    onPointerMove,
    setMiddleButtonState,
  };
}; 