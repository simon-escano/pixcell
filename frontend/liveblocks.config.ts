import { Profile } from "@/db/schema";
import { Color, Layer, Point } from "@/types";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";

declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      profile: Profile
      selection: string[];
      cursor: Point | null;
      pencilDraft: [x: number, y: number, pressure: number][] | null;
      penColor: Color | null;
    };
    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      layers: LiveMap<string, LiveObject<Layer>>;
      layerIds: LiveList<string>;
    };
  }
}
