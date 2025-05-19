import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Sample } from "@/db/schema";
import {
  Camera,
  CanvasMode,
  CanvasState,
  Color,
  LayerType,
  Point,
  Side,
  XYWH,
} from "@/types";
import { LiveObject } from "@liveblocks/client";
import {
  useCanRedo,
  useCanUndo,
  useHistory,
  useMutation,
  useOthersMapped,
  useSelf,
  useStorage,
} from "@liveblocks/react/suspense";
import {
  CircleDashed,
  MousePointer2,
  Pencil,
  Redo,
  Search,
  SquareDashed,
  Undo,
} from "lucide-react";
import { nanoid } from "nanoid";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import LayerComponent from "./components/LayerComponent";
import MultiplayerGuides from "./components/MultiplayerGuides";
import Path from "./components/Path";
import SelectionBox from "./components/SelectionBox";
import SelectionTools from "./components/SelectionTools";
import useDeleteLayers from "./hooks/useDeleteLayers";
import useDisableScrollBounce from "./hooks/useDisableScrollBounce";
import styles from "./index.module.css";
import {
  colorToCss,
  connectionIdToColor,
  findIntersectingLayersWithRectangle,
  penPointsToPathLayer,
  pointerEventToCanvasPoint,
  resizeBounds,
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
  const [isMiddleButtonDown, setIsMiddleButtonDown] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<SVGSVGElement>(null);
  const [selectedModel, setSelectedModel] = useState(
    "parasite_detection_yolov8",
  );

  const [processedImageUrl, setProcessedImageUrl] = useState<string>(
    sample.imageUrl,
  );

  const pencilDraft = useSelf((me) => me.presence.pencilDraft);
  const [canvasState, setState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });
  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 252,
    g: 142,
    b: 42,
  });
  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

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
      imgRef.current.src = resultUrl;
      setProcessedImageUrl(resultUrl);

      toast.dismiss();
      toast.success("Prediction complete!");
    } catch (error: any) {
      toast.dismiss();
      toast.error("Prediction failed: " + error.message);
    }
  }

  useDisableScrollBounce();

  const deleteLayers = useDeleteLayers();

  /**
   * Hook used to listen to Undo / Redo and delete selected layers
   */
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

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [deleteLayers, history]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    setCamera({
      x: rect.width / 2,
      y: rect.height / 2,
    });
  }, []);

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

  useEffect(() => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    setCamera({
      x: rect.width / 2,
      y: rect.height / 2,
    });
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [canvasRef]);

  // Add this SVG image element inside the canvas, before the layerIds.map

  /**
   * Select the layer if not already selected and start translating the selection
   */
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
      setState({ mode: CanvasMode.Translating, current: point });
    },
    [setState, camera, history, canvasState.mode],
  );

  /**
   * Start resizing the layer
   */
  const onResizeHandlePointerDown = useCallback(
    (corner: Side, initialBounds: XYWH) => {
      history.pause();
      setState({
        mode: CanvasMode.Resizing,
        initialBounds,
        corner,
      });
    },
    [history],
  );

  /**
   * Insert an ellipse or a rectangle at the given position and select it
   */
  const insertLayer = useMutation(
    (
      { storage, setMyPresence },
      layerType: LayerType.Ellipse | LayerType.Rectangle,
      position: Point,
    ) => {
      const liveLayers = storage.get("layers");
      if (liveLayers.size >= MAX_LAYERS) {
        return;
      }

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
      setState({ mode: CanvasMode.None });
    },
    [lastUsedColor],
  );

  /**
   * Transform the drawing of the current user in a layer and reset the presence to delete the draft.
   */
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
      setState({ mode: CanvasMode.Pencil });
    },
    [lastUsedColor],
  );

  /**
   * Move selected layers on the canvas
   */
  const translateSelectedLayers = useMutation(
    ({ storage, self }, point: Point) => {
      if (canvasState.mode !== CanvasMode.Translating) {
        return;
      }

      // Calculate offset from the previous position
      const offset = {
        x: point.x - canvasState.current.x,
        y: point.y - canvasState.current.y,
      };

      // Get the live layers
      const liveLayers = storage.get("layers");

      // Update each selected layer
      for (const id of self.presence.selection) {
        const layer = liveLayers.get(id);
        if (layer) {
          // Apply offset directly to layer position
          layer.update({
            x: layer.get("x") + offset.x,
            y: layer.get("y") + offset.y,
          });
        }
      }

      // Update the current position for the next calculation
      setState({ mode: CanvasMode.Translating, current: point });
    },
    [canvasState],
  );
  /**
   * Resize selected layer. Only resizing a single layer is allowed.
   */
  const resizeSelectedLayer = useMutation(
    ({ storage, self }, point: Point) => {
      if (canvasState.mode !== CanvasMode.Resizing) {
        return;
      }

      const bounds = resizeBounds(
        canvasState.initialBounds,
        canvasState.corner,
        point,
      );

      const liveLayers = storage.get("layers");
      const layer = liveLayers.get(self.presence.selection[0]);
      if (layer) {
        layer.update(bounds);
      }
    },
    [canvasState],
  );

  const unselectLayers = useMutation(({ self, setMyPresence }) => {
    if (self.presence.selection.length > 0) {
      setMyPresence({ selection: [] }, { addToHistory: true });
    }
  }, []);

  /**
   * Insert the first path point and start drawing with the pencil
   */
  const startDrawing = useMutation(
    ({ setMyPresence }, point: Point, pressure: number) => {
      setMyPresence({
        pencilDraft: [[point.x, point.y, pressure]],
        penColor: lastUsedColor,
      });
      console.log(point);
    },
    [lastUsedColor],
  );

  /**
   * Continue the drawing and send the current draft to other users in the room
   */
  const continueDrawing = useMutation(
    ({ self, setMyPresence }, point: Point, e: React.PointerEvent) => {
      const { pencilDraft } = self.presence;
      if (
        canvasState.mode !== CanvasMode.Pencil ||
        e.buttons !== 1 ||
        pencilDraft == null
      ) {
        return;
      }

      setMyPresence({
        cursor: point,
        pencilDraft:
          pencilDraft.length === 1 &&
          pencilDraft[0][0] === point.x &&
          pencilDraft[0][1] === point.y
            ? pencilDraft
            : [...pencilDraft, [point.x, point.y, e.pressure]],
      });
    },
    [canvasState.mode],
  );

  /**
   * Start multiselection with the selection net if the pointer move enough since pressed
   */
  const startMultiSelection = useCallback((current: Point, origin: Point) => {
    // If the distance between the pointer position and the pointer position when it was pressed
    if (Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) > 5) {
      // Start multi selection
      setState({
        mode: CanvasMode.SelectionNet,
        origin,
        current,
      });
    }
  }, []);

  /**
   * Update the position of the selection net and select the layers accordingly
   */
  const updateSelectionNet = useMutation(
    ({ storage, setMyPresence }, current: Point, origin: Point) => {
      const layers = storage.get("layers").toImmutable();
      setState({
        mode: CanvasMode.SelectionNet,
        origin: origin,
        current,
      });
      const ids = findIntersectingLayersWithRectangle(
        layerIds,
        layers,
        origin,
        current,
      );
      setMyPresence({ selection: ids });
    },
    [layerIds],
  );

  const selections = useOthersMapped((other) => other.presence.selection);

  /**
   * Create a map layerId to color based on the selection of all the users in the room
   */
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

  const onWheel = useCallback((e: React.WheelEvent) => {
    // Pan the camera based on the wheel delta
    setCamera((camera) => ({
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY,
    }));
  }, []);

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e, camera);

      // Handle middle mouse button
      if (e.button === 1) {
        setIsMiddleButtonDown(true);
        setState({ mode: CanvasMode.None });
        return;
      }

      if (canvasState.mode === CanvasMode.Inserting) {
        return;
      }

      if (canvasState.mode === CanvasMode.Pencil) {
        startDrawing(point, e.pressure);
        return;
      }

      setState({ origin: point, mode: CanvasMode.Pressing });
    },
    [camera, canvasState.mode, setState, startDrawing],
  );

  // Modify onPointerMove to handle panning with middle mouse
  const onPointerMove = useMutation(
    ({ setMyPresence }, e: React.PointerEvent) => {
      e.preventDefault();
      const current = pointerEventToCanvasPoint(e, camera);

      // Handle middle mouse button drag
      if (isMiddleButtonDown) {
        setCamera((camera) => ({
          x: camera.x + e.movementX,
          y: camera.y + e.movementY,
        }));
        setMyPresence({ cursor: current });
        return;
      }

      if (canvasState.mode === CanvasMode.Pressing) {
        startMultiSelection(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.SelectionNet) {
        updateSelectionNet(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.Translating) {
        translateSelectedLayers(current);
      } else if (canvasState.mode === CanvasMode.Resizing) {
        resizeSelectedLayer(current);
      } else if (canvasState.mode === CanvasMode.Pencil) {
        continueDrawing(current, e);
      }
      setMyPresence({ cursor: current });
    },
    [
      camera,
      canvasState,
      continueDrawing,
      resizeSelectedLayer,
      startMultiSelection,
      translateSelectedLayers,
      updateSelectionNet,
      isMiddleButtonDown, // Add this dependency
    ],
  );

  // Modify onPointerUp to handle middle mouse button release
  const onPointerUp = useMutation(
    ({}, e) => {
      // Reset middle mouse button state
      if (e.button === 1) {
        setIsMiddleButtonDown(false);
        return;
      }

      const point = pointerEventToCanvasPoint(e, camera);

      if (
        canvasState.mode === CanvasMode.None ||
        canvasState.mode === CanvasMode.Pressing
      ) {
        unselectLayers();
        setState({
          mode: CanvasMode.None,
        });
      } else if (canvasState.mode === CanvasMode.Pencil) {
        insertPath();
      } else if (canvasState.mode === CanvasMode.Inserting) {
        insertLayer(canvasState.layerType, point);
      } else {
        setState({
          mode: CanvasMode.None,
        });
      }
      history.resume();
    },
    [
      camera,
      canvasState,
      history,
      insertLayer,
      insertPath,
      setState,
      unselectLayers,
    ],
  );

  const onPointerLeave = useMutation(
    ({ setMyPresence }) => setMyPresence({ cursor: null }),
    [],
  );

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
            {/* Blue square that show the selection of the current users. Also contains the resize handles. */}
            <SelectionBox
              onResizeHandlePointerDown={onResizeHandlePointerDown}
            />
            {/* Selection net that appears when the user is selecting multiple layers at once */}
            {canvasState.mode === CanvasMode.SelectionNet &&
              canvasState.current != null && (
                <rect
                  className={styles.selection_net}
                  x={Math.min(canvasState.origin.x, canvasState.current.x)}
                  y={Math.min(canvasState.origin.y, canvasState.current.y)}
                  width={Math.abs(canvasState.origin.x - canvasState.current.x)}
                  height={Math.abs(
                    canvasState.origin.y - canvasState.current.y,
                  )}
                />
              )}
            <MultiplayerGuides />
            {/* Drawing in progress. Still not commited to the storage. */}
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
      <div className="bg-background border-muted-foreground/20 pointer-events-auto flex items-center justify-between gap-4 rounded-lg rounded-t-none border p-2">
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center justify-center">
            <ToggleGroup
              type="single"
              variant={"outline"}
              className="gap-2"
              size={"lg"}
            >
              <ToggleGroupItem
                value="select"
                variant={"outline"}
                onClick={() => setState({ mode: CanvasMode.None })}
                disabled={disabled}
              >
                <MousePointer2 />
              </ToggleGroupItem>
              <ToggleGroupItem
                variant={"outline"}
                value="pencil"
                onClick={() => setState({ mode: CanvasMode.Pencil })}
                disabled={disabled}
              >
                <Pencil />
              </ToggleGroupItem>
              <ToggleGroupItem
                variant={"outline"}
                value="rectangle"
                disabled={disabled}
                onClick={() =>
                  setState({
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
                  setState({
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
          <div className="flex items-center justify-center gap-2 self-stretch">
            <Button
              variant={"outline"}
              onClick={history.undo}
              disabled={!canUndo}
              className="h-full"
            >
              <Undo />
            </Button>
            <Button
              variant={"outline"}
              onClick={history.redo}
              disabled={!canRedo}
              className="h-full"
            >
              <Redo />
            </Button>
          </div>
        </div>
        <div className="flex h-full items-center gap-2">
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
            onClick={handleProcessImage}
            disabled={disabled}
            className="h-full"
          >
            <Search></Search>
            Detect
          </Button>
        </div>
      </div>
    </div>
  );
}
