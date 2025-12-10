"use client";

import { useSelf } from "@liveblocks/react/suspense";
import { useTheme } from "next-themes";
import {
  AssetRecordType,
  DefaultStylePanel,
  Editor,
  TLImageShape,
  Tldraw,
  createShapeId,
} from "tldraw";
import "tldraw/tldraw.css";
import { Avatars } from "./Avatars";
import { useStorageStore } from "./useStorageStore";
import { MetaSampleImage } from "../../../../types";

interface StorageTldrawProps {
  sampleImage: MetaSampleImage;
  canEdit?: boolean;
}

export function StorageTldraw({
  sampleImage,
  canEdit,
}: StorageTldrawProps) {
  const id = useSelf((me) => me.id);
  const info = useSelf((me) => me.info);
  const { resolvedTheme } = useTheme();

  const store = useStorageStore({
    user: { id, color: info.color, name: info.name },
  });

  const shapeId = createShapeId(sampleImage.id);

  const insertSampleImage = (editor: Editor) => {
    const imageWidth = sampleImage.metadata.width;
    const imageHeight = sampleImage.metadata.height;
    const assetId = AssetRecordType.createId(sampleImage.id);
    if (editor.getShape(shapeId) === undefined) {
      const wasReadonly = editor.getInstanceState().isReadonly;
      
      if (wasReadonly) {
        editor.updateInstanceState({ isReadonly: false });
      }
      
      editor
        .createAssets([
          {
            id: assetId,
            type: "image",
            typeName: "asset",
            props: {
              name: "sampleImage",
              src: sampleImage.imageUrl,
              w: imageWidth,
              h: imageHeight,
              mimeType: "image/png",
              isAnimated: false,
            },
            meta: {},
          },
        ])
        .createShape({
          id: shapeId,
          type: "image",
          isLocked: true,
          x: (window.innerWidth - imageWidth) / 2,
          y: (window.innerHeight - imageHeight) / 2,
          props: {
            assetId,
            w: imageWidth,
            h: imageHeight,
          },
        })
        .zoomToFit({ animation: { duration: 100 } });
      
      if (wasReadonly) {
        editor.updateInstanceState({ isReadonly: true });
      }
    }
  };


  return (
    <div className="h-full w-full">
      <Tldraw
        className="z-49"
        options={{ maxPages: 1 }}
        store={store}
        onMount={(editor) => {
          editor.user.updateUserPreferences({
            colorScheme: resolvedTheme === "dark" ? "dark" : "light",
          });
          editor.updateInstanceState({
            isReadonly: !canEdit,
            isGridMode: true,
          });
          editor.sideEffects.registerBeforeChangeHandler(
            "shape",
            (prev, next) => {
              if (
                editor.isShapeOfType<TLImageShape>(prev, "image") &&
                editor.isShapeOfType<TLImageShape>(next, "image") &&
                next.id === shapeId
              ) {
                if (
                  next.x !== prev.x ||
                  next.y !== prev.y ||
                  next.rotation !== prev.rotation ||
                  next.props.w !== prev.props.w ||
                  next.props.h !== prev.props.h
                ) {
                  return prev;
                }
              }
              return next;
            },
          );
          editor.sideEffects.registerBeforeDeleteHandler("shape", (shape) => {
            if (shape.id === shapeId) {
              return false;
            }
            return;
          });

          insertSampleImage(editor);
        }}
        overrides={{
          tools: (_editor, tools) => {
            delete tools.asset;
            return tools;
          },
          actions: (_editor, actions) => {
            delete actions["toggle-lock"];
            return actions;
          },
        }}
        components={{
          DebugPanel: null,
          PageMenu: null,
          MainMenu: null,

          StylePanel: () => (
            <div
              style={{
                display: "flex-column",
                marginTop: 4,
              }}
            >
              <Avatars />
              <DefaultStylePanel />
            </div>
          ),
        }}
        autoFocus
        inferDarkMode
      />
    </div>
  );
}