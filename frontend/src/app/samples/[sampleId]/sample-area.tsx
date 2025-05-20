import { Sample } from "@/db/schema";
import {
  CanvasMode,
  Color
} from "@/types";
import {
  useCanRedo,
  useCanUndo,
  useHistory,
  useMutation,
  useOthersMapped,
  useSelf,
  useStorage,
} from "@liveblocks/react/suspense";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import LayerComponent from "./components/LayerComponent";
import MultiplayerGuides from "./components/MultiplayerGuides";
import Path from "./components/Path";
import SelectionBox from "./components/SelectionBox";
import SelectionTools from "./components/SelectionTools";
import { Toolbar } from "./components/Toolbar";
import { useCamera } from "./hooks/useCamera";
import { useCanvasState } from "./hooks/useCanvasState";
import useDeleteLayers from "./hooks/useDeleteLayers";
import useDisableScrollBounce from "./hooks/useDisableScrollBounce";
import { useDrawing } from "./hooks/useDrawing";
import { useImageProcessing } from "./hooks/useImageProcessing";
import { useLayerOperations } from "./hooks/useLayerOperations";
import { useSelection } from "./hooks/useSelection";
import {
  colorToCss,
  connectionIdToColor,
  pointerEventToCanvasPoint
} from "./utils";

const MAX_LAYERS = 100;

type SampleAreaProps = {
  roomName: string;
  username: string;
  sample: Sample;
  disabled?: boolean;
};

export default function SampleArea({
  roomName,
  username,
  sample,
  disabled,
}: SampleAreaProps) {
  const layerIds = useStorage((root) => root.layerIds);
  const imgRef = useRef<HTMLImageElement>(new Image());
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<SVGSVGElement>(null);

  const {
    canvasState,
    setCanvasMode,
    setInsertingMode,
    setPressingMode,
    setSelectionNetMode,
    setTranslatingMode,
    setResizingMode,
  } = useCanvasState();

  const {
    camera,
    isMiddleButtonDown,
    onWheel,
    onPointerMove: onCameraPointerMove,
    setMiddleButtonState,
  } = useCamera(canvasRef);

  const {
    processedImageUrl,
    selectedModel,
    setSelectedModel,
    handleProcessImage,
  } = useImageProcessing(sample.imageUrl);

  const pencilDraft = useSelf((me) => me.presence.pencilDraft);
  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 252,
    g: 142,
    b: 42,
  });
  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  useDisableScrollBounce();
  const deleteLayers = useDeleteLayers();

  const {
    insertLayer,
    insertPath,
    translateSelectedLayers,
    resizeSelectedLayer,
    onResizeHandlePointerDown,
  } = useLayerOperations(lastUsedColor, setCanvasMode, setTranslatingMode, setResizingMode);

  const { startDrawing, continueDrawing } = useDrawing(lastUsedColor);

  const {
    startMultiSelection,
    updateSelectionNet,
    unselectLayers,
  } = useSelection(layerIds, setSelectionNetMode);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "Backspace": {
          deleteLayers();
          break;
        }
        case "z": {
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey) {
              history.redo();
            } else {
              history.undo();
            }
            break;
          }
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [deleteLayers, history]);

  useEffect(() => {
    if (!sample?.imageUrl) return;

    imgRef.current.onload = () => {
      setImageSize({
        width: imgRef.current.width,
        height: imgRef.current.height,
      });
    };

    imgRef.current.src = sample.imageUrl;
  }, [sample]);

  const onLayerPointerDown = useMutation(
    ({ self, setMyPresence }, e: React.PointerEvent, layerId: string) => {
      if (
        canvasState.mode === CanvasMode.Pencil ||
        canvasState.mode === CanvasMode.Inserting
      ) {
        return;
      }

      history.pause();
      e.stopPropagation();
      const point = pointerEventToCanvasPoint(e, camera);
      if (!self.presence.selection.includes(layerId)) {
        setMyPresence({ selection: [layerId] }, { addToHistory: true });
      }
      setTranslatingMode(point);
    },
    [setTranslatingMode, camera, history, canvasState.mode],
  );

  const onPointerDown = useMutation(
    ({}, e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e, camera);

      if (e.button === 1) {
        setMiddleButtonState(true);
        setCanvasMode(CanvasMode.None);
        return;
      }

      if (canvasState.mode === CanvasMode.Inserting) {
        return;
      }

      if (canvasState.mode === CanvasMode.Pencil) {
        startDrawing(point, e.pressure);
        return;
      }

      setPressingMode(point);
    },
    [
      camera,
      canvasState.mode,
      setCanvasMode,
      setMiddleButtonState,
      setPressingMode,
      startDrawing,
    ],
  );

  const onPointerMove = useMutation(
    ({ setMyPresence }, e: React.PointerEvent) => {
      e.preventDefault();
      const current = pointerEventToCanvasPoint(e, camera);

      onCameraPointerMove(e);

      if (canvasState.mode === CanvasMode.Pressing) {
        startMultiSelection(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.SelectionNet) {
        updateSelectionNet(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.Translating) {
        translateSelectedLayers(current, canvasState.current);
      } else if (canvasState.mode === CanvasMode.Resizing) {
        resizeSelectedLayer(current, canvasState.initialBounds, canvasState.corner);
      } else if (canvasState.mode === CanvasMode.Pencil) {
        continueDrawing(current, e);
      }
      setMyPresence({ cursor: current });
    },
    [
      camera,
      canvasState,
      continueDrawing,
      onCameraPointerMove,
      resizeSelectedLayer,
      startMultiSelection,
      translateSelectedLayers,
      updateSelectionNet,
    ],
  );

  const onPointerUp = useMutation(
    ({}, e) => {
      if (e.button === 1) {
        setMiddleButtonState(false);
        return;
      }

      const point = pointerEventToCanvasPoint(e, camera);

      if (
        canvasState.mode === CanvasMode.None ||
        canvasState.mode === CanvasMode.Pressing
      ) {
        unselectLayers();
        setCanvasMode(CanvasMode.None);
      } else if (canvasState.mode === CanvasMode.Pencil) {
        insertPath();
      } else if (canvasState.mode === CanvasMode.Inserting) {
        insertLayer(canvasState.layerType, point);
      } else {
        setCanvasMode(CanvasMode.None);
      }
      history.resume();
    },
    [
      camera,
      canvasState,
      history,
      insertLayer,
      insertPath,
      setCanvasMode,
      setMiddleButtonState,
      unselectLayers,
    ],
  );

  const onPointerLeave = useMutation(
    ({ setMyPresence }) => setMyPresence({ cursor: null }),
    [],
  );

  const selections = useOthersMapped((other) => other.presence.selection);

  const layerIdsToColorSelection = useMemo(() => {
    const layerIdsToColorSelection: Record<string, string> = {};

    for (const user of selections) {
      const [connectionId, selection] = user;
      for (const layerId of selection) {
        layerIdsToColorSelection[layerId] = connectionIdToColor(connectionId);
      }
    }

    return layerIdsToColorSelection;
  }, [selections]);

  return (
    <div className="flex w-full flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <SelectionTools
          isAnimated={
            canvasState.mode !== CanvasMode.Translating &&
            canvasState.mode !== CanvasMode.Resizing
          }
          camera={camera}
          setLastUsedColor={setLastUsedColor}
        />
        <svg
          ref={canvasRef}
          className="bg-background relative inset-0 h-full w-full flex-1 rounded-lg rounded-b-none border border-b-0 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]"
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          onPointerUp={onPointerUp}
          style={{ cursor: isMiddleButtonDown ? "grabbing" : "default" }}
        >
          <g
            style={{
              transform: `translate(${camera.x}px, ${camera.y}px)`,
            }}
          >
            {processedImageUrl && (
              <image
                href={processedImageUrl}
                x={-imageSize.width / 2}
                y={-imageSize.height / 2}
                width={imageSize.width}
                height={imageSize.height}
                className="pointer-events-none rounded-lg"
              />
            )}
            {layerIds.map((layerId) => (
              <LayerComponent
                key={layerId}
                id={layerId}
                mode={canvasState.mode}
                onLayerPointerDown={onLayerPointerDown}
                selectionColor={layerIdsToColorSelection[layerId]}
              />
            ))}
            <SelectionBox
              onResizeHandlePointerDown={onResizeHandlePointerDown}
            />
            {canvasState.mode === CanvasMode.SelectionNet &&
              canvasState.current != null && (
                <rect
                  className="fill-primary/20 stroke-primary stroke-2"
                  x={Math.min(canvasState.origin.x, canvasState.current.x)}
                  y={Math.min(canvasState.origin.y, canvasState.current.y)}
                  width={Math.abs(canvasState.origin.x - canvasState.current.x)}
                  height={Math.abs(
                    canvasState.origin.y - canvasState.current.y,
                  )}
                />
              )}
            <MultiplayerGuides />
            {pencilDraft != null && pencilDraft.length > 0 && (
              <Path
                points={pencilDraft}
                fill={colorToCss(lastUsedColor)}
                x={0}
                y={0}
              />
            )}
          </g>
        </svg>
      </div>
      <Toolbar
        canvasMode={canvasState.mode}
        setCanvasMode={setCanvasMode}
        setInsertingMode={setInsertingMode}
        onUndo={history.undo}
        onRedo={history.redo}
        canUndo={canUndo}
        canRedo={canRedo}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        onProcessImage={handleProcessImage}
        disabled={disabled}
      />
    </div>
  );
}
