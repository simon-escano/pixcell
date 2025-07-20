"use client";

import { ImageUp, X } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface FilePreview {
  file: File;
  preview: string;
}

const UploadSampleFile = ({
  onFilesChange,
  files,
}: {
  onFilesChange: (files: File[]) => void;
  files: File[];
}) => {
  const [previews, setPreviews] = useState<FilePreview[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const newFiles = [...files, ...selectedFiles];
    onFilesChange(newFiles);

    // Create previews for new files
    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPreview: FilePreview = {
          file,
          preview: reader.result as string,
        };
        setPreviews((prev) => [...prev, newPreview]);
      };
      reader.readAsDataURL(file);
    });

    // Reset the input value to allow selecting the same files again if needed
    e.target.value = '';
  };

  const removeFile = (indexToRemove: number) => {
    const newFiles = files.filter((_, index) => index !== indexToRemove);
    const newPreviews = previews.filter((_, index) => index !== indexToRemove);
    
    onFilesChange(newFiles);
    setPreviews(newPreviews);
  };

  return (
    <div className="flex flex-col">
      <div className="border-border h-50 relative overflow-hidden rounded-b-lg border-2 border-t-0 border-dashed">
        {previews.length === 0 ? (
          // Empty state - show upload area
          <label
            htmlFor="file-upload"
            className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center"
          >
            <div className="flex flex-col items-center gap-2">
              <ImageUp className="text-muted-foreground h-8 w-8" />
              <span className="text-sm text-muted-foreground">
                Click to select images
              </span>
            </div>
          </label>
        ) : (
          // Preview grid with add button
          <div className="flex flex-col p-2 h-full">
            <div className="grid grid-cols-3 gap-2 flex-1 overflow-y-auto">
              {previews.map((item, index) => (
                <div key={index} className="relative group">
                  <div className="w-full h-20 relative rounded-lg overflow-hidden border">
                    <Image
                      src={item.preview}
                      alt={`Preview ${index + 1}`}
                      className="object-cover h-full w-full"
                      fill
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Add more files button */}
              <label
                htmlFor="file-upload"
                className="w-full h-20 border-2 border-dashed border-muted-foreground/50 rounded-lg flex items-center justify-center cursor-pointer hover:border-muted-foreground transition-colors"
              >
                <ImageUp className="h-6 w-6 text-muted-foreground" />
              </label>
            </div>
            
            <div className="mt-2 text-xs text-muted-foreground">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </div>
          </div>
        )}
        
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default UploadSampleFile;