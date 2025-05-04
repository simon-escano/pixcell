"use client";

import { ImageUp } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

const UploadSampleFile = ({
  onFileChange,
}: {
  onFileChange: (file: File | null) => void;
}) => {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    onFileChange(file);
  };

  return (
    <div className="flex flex-col">
      <div className="border-border relative aspect-video overflow-hidden rounded-lg border-2 border-dashed">
        <label
          htmlFor="file-upload"
          className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center"
        >
          {preview ? (
            <Image
              src={preview}
              alt="Preview"
              className="absolute inset-0 h-full w-full rounded-3xl object-cover p-4"
              fill
            />
          ) : (
            <ImageUp className="text-muted-foreground h-8 w-8" />
          )}
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </label>
      </div>
    </div>
  );
};

export default UploadSampleFile;
