import { TextLayer } from "@/types";
import { memo, useState } from "react";
import { useMutation } from "@liveblocks/react/suspense";

interface TextLayerProps {
  id: string;
  layer: TextLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
}

export const TextLayerComponent = memo(({
  layer,
  onPointerDown,
  id,
  selectionColor,
}: TextLayerProps) => {
  const { x, y, width, height, fill, value, fontSize, fontFamily } = layer;
  const [isEditing, setIsEditing] = useState(false);

  const updateText = useMutation(({ storage }, newValue: string) => {
    const liveLayers = storage.get("layers");
    const layer = liveLayers.get(id);
    if (layer) {
      layer.update({ value: newValue });
    }
  }, [id]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      setIsEditing(false);
    }
  };

  return (
    <foreignObject
      x={x}
      y={y}
      width={width}
      height={height}
      onPointerDown={(e) => onPointerDown(e, id)}
      onDoubleClick={handleDoubleClick}
      style={{
        outline: selectionColor ? `1px solid ${selectionColor}` : "none",
      }}
    >
      {isEditing ? (
        <textarea
          value={value}
          onChange={(e) => updateText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            color: `rgb(${fill.r}, ${fill.g}, ${fill.b})`,
            fontSize: `${fontSize}px`,
            fontFamily,
            width: "100%",
            height: "100%",
            border: "none",
            padding: "0",
            background: "transparent",
            resize: "none",
            outline: "none",
            fontWeight: "bold",
          }}
          autoFocus
        />
      ) : (
        <div
          style={{
            color: `rgb(${fill.r}, ${fill.g}, ${fill.b})`,
            fontSize: `${fontSize}px`,
            fontFamily,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
          }}
        >
          {value}
        </div>
      )}
    </foreignObject>
  );
});

TextLayerComponent.displayName = "TextLayerComponent"; 