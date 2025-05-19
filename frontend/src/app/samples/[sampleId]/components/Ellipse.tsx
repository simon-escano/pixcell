import { EllipseLayer } from "../../../../types";
import { colorToCss } from "../utils";

type Props = {
  id: string;
  layer: EllipseLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
};

export default function Ellipse({
  layer,
  onPointerDown,
  id,
  selectionColor,
}: Props) {
  return (
    <ellipse
      onPointerDown={(e) => onPointerDown(e, id)}
      style={{
        transform: `translate(${layer.x}px, ${layer.y}px)`,
        strokeDasharray: "4 2",
      }}
      cx={layer.width / 2}
      cy={layer.height / 2}
      rx={layer.width / 2}
      ry={layer.height / 2}
      fill="transparent"
      stroke={layer.fill ? colorToCss(layer.fill) : "#CCC"}
      strokeWidth="1"
    />
  );
}
