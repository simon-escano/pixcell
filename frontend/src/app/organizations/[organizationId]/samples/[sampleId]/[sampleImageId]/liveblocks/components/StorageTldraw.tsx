"use client";

import { useSelf } from "@liveblocks/react/suspense";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
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
  aiImageUrl?: string | null;
  showAiImage?: boolean;
  onShowAiImageChange?: (show: boolean) => void;
}

export function StorageTldraw({
  sampleImage,
  canEdit,
  aiImageUrl,
  showAiImage: controlledShowAiImage,
  onShowAiImageChange,
}: StorageTldrawProps) {
  // Use controlled state if provided, otherwise use internal state
  const [internalShowAiImage, setInternalShowAiImage] = useState(!!aiImageUrl);
  const showAiImage = controlledShowAiImage !== undefined ? controlledShowAiImage : internalShowAiImage;
  const setShowAiImage = onShowAiImageChange || setInternalShowAiImage;
  const hasAiImage = !!aiImageUrl;
  const editorRef = useRef<Editor | null>(null);
  const id = useSelf((me) => me.id);
  const info = useSelf((me) => me.info);
  const { resolvedTheme } = useTheme();

  const store = useStorageStore({
    user: { id, color: info.color, name: info.name },
  });

  const shapeId = createShapeId(sampleImage.id);
  const originalAssetId = AssetRecordType.createId(sampleImage.id);
  const aiShapeId = createShapeId(`${sampleImage.id}_ai`);
  const aiAssetId = AssetRecordType.createId(`${sampleImage.id}_ai`);
  
  // Update to AI view when AI image becomes available
  useEffect(() => {
    if (aiImageUrl && controlledShowAiImage === undefined) {
      // Only auto-set if not controlled
      setShowAiImage(true);
    }
    // If AI image becomes available and editor is mounted, create the AI shape
    if (aiImageUrl && editorRef.current) {
      const editor = editorRef.current;
      const aiShape = editor.getShape(aiShapeId);
      if (!aiShape && aiImageUrl) {
        const originalShape = editor.getShape(shapeId);
        if (originalShape) {
          const imageWidth = sampleImage.metadata.width;
          const imageHeight = sampleImage.metadata.height;
          const x = originalShape.x;
          const y = originalShape.y;
          
          const wasReadonly = editor.getInstanceState().isReadonly;
          if (wasReadonly) {
            editor.updateInstanceState({ isReadonly: false });
          }
          
          editor.createAssets([
            {
              id: aiAssetId,
              type: "image",
              typeName: "asset",
              props: {
                name: "sampleImageAi",
                src: aiImageUrl,
                w: imageWidth,
                h: imageHeight,
                mimeType: "image/jpeg",
                isAnimated: false,
              },
              meta: {},
            },
          ]).createShape({
            id: aiShapeId,
            type: "image",
            isLocked: true,
            x,
            y,
            props: {
              assetId: aiAssetId,
              w: imageWidth,
              h: imageHeight,
            },
          });
          
          if (wasReadonly) {
            editor.updateInstanceState({ isReadonly: true });
          }
        }
      }
    }
  }, [aiImageUrl, aiShapeId, aiAssetId, shapeId, sampleImage.metadata.width, sampleImage.metadata.height, controlledShowAiImage, setShowAiImage]);

  const insertSampleImages = (editor: Editor) => {
    const imageWidth = sampleImage.metadata.width;
    const imageHeight = sampleImage.metadata.height;
    const x = (window.innerWidth - imageWidth) / 2;
    const y = (window.innerHeight - imageHeight) / 2;
    
    const originalShape = editor.getShape(shapeId);
    const aiShape = editor.getShape(aiShapeId);
    
    if (originalShape === undefined) {
      const wasReadonly = editor.getInstanceState().isReadonly;
      
      if (wasReadonly) {
        editor.updateInstanceState({ isReadonly: false });
      }
      
      // Create original image asset and shape
      editor.createAssets([
        {
          id: originalAssetId,
          type: "image",
          typeName: "asset",
          props: {
            name: "sampleImage",
            src: sampleImage.imageUrl || "",
            w: imageWidth,
            h: imageHeight,
            mimeType: "image/png",
            isAnimated: false,
          },
          meta: {},
        },
      ]).createShape({
        id: shapeId,
        type: "image",
        isLocked: true,
        x,
        y,
        props: {
          assetId: originalAssetId,
          w: imageWidth,
          h: imageHeight,
        },
      });
      
      // Create AI image asset and shape if AI image exists
      if (hasAiImage && aiImageUrl) {
        editor.createAssets([
          {
            id: aiAssetId,
            type: "image",
            typeName: "asset",
            props: {
              name: "sampleImageAi",
              src: aiImageUrl,
              w: imageWidth,
              h: imageHeight,
              mimeType: "image/jpeg",
              isAnimated: false,
            },
            meta: {},
          },
        ]).createShape({
          id: aiShapeId,
          type: "image",
          isLocked: true,
          x, // Same position as original
          y, // Same position as original
          props: {
            assetId: aiAssetId,
            w: imageWidth,
            h: imageHeight,
          },
        });
      }
      
      editor.zoomToFit({ animation: { duration: 100 } });
      
      if (wasReadonly) {
        editor.updateInstanceState({ isReadonly: true });
      }
    } else if (hasAiImage && aiImageUrl && aiShape === undefined) {
      // If original exists but AI shape doesn't, create it
      const wasReadonly = editor.getInstanceState().isReadonly;
      
      if (wasReadonly) {
        editor.updateInstanceState({ isReadonly: false });
      }
      
      const originalShape = editor.getShape(shapeId);
      const x = originalShape?.x || (window.innerWidth - imageWidth) / 2;
      const y = originalShape?.y || (window.innerHeight - imageHeight) / 2;
      
      editor.createAssets([
        {
          id: aiAssetId,
          type: "image",
          typeName: "asset",
          props: {
            name: "sampleImageAi",
            src: aiImageUrl,
            w: imageWidth,
            h: imageHeight,
            mimeType: "image/jpeg",
            isAnimated: false,
          },
          meta: {},
        },
      ]).createShape({
        id: aiShapeId,
        type: "image",
        isLocked: true,
        x,
        y,
        props: {
          assetId: aiAssetId,
          w: imageWidth,
          h: imageHeight,
        },
      });
      
      if (wasReadonly) {
        editor.updateInstanceState({ isReadonly: true });
      }
    }
  };


  return (
    <div className="h-full w-full relative">
      <Tldraw
        className="z-49"
        options={{ maxPages: 1 }}
        store={store}
        getShapeVisibility={(shape) => {
          // Hide/show AI image based on toggle state
          if (shape.id === aiShapeId) {
            return showAiImage && hasAiImage ? 'visible' : 'hidden';
          }
          // Hide/show original image based on toggle state
          if (shape.id === shapeId) {
            return showAiImage && hasAiImage ? 'hidden' : 'visible';
          }
          return 'inherit';
        }}
        onMount={(editor) => {
          editorRef.current = editor;
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
              // Prevent changes to both original and AI image shapes
              if (
                editor.isShapeOfType<TLImageShape>(prev, "image") &&
                editor.isShapeOfType<TLImageShape>(next, "image") &&
                (next.id === shapeId || next.id === aiShapeId)
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
            if (shape.id === shapeId || shape.id === aiShapeId) {
              return false;
            }
            return;
          });

          insertSampleImages(editor);
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