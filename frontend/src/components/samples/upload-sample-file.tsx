"use client"

import React, { useState } from "react"
import { ImageUp, X, Camera } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import CameraModal from "@/app/samples/components/camera-client"

interface FilePreview {
  file: File
  preview: string
}

const UploadSampleFile = ({
  onFilesChange,
  files,
}: {
  onFilesChange: (files: File[]) => void
  files: File[]
}) => {
  const [previews, setPreviews] = useState<FilePreview[]>([])
  const [cameraOpen, setCameraOpen] = useState(false)

  // Generate previews for all files (uploaded or from camera)
  React.useEffect(() => {
    const generatePreviews = async () => {
      const newPreviews: FilePreview[] = await Promise.all(
        files.map(async (file) => {
          // If preview already exists, reuse it
          const existing = previews.find((p) => p.file === file)
          if (existing) return existing
          // Otherwise, create a new preview
          return new Promise<FilePreview>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              resolve({ file, preview: reader.result as string })
            }
            reader.readAsDataURL(file)
          })
        }),
      )
      setPreviews(newPreviews)
    }
    if (files.length > 0) {
      generatePreviews()
    } else {
      setPreviews([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return
    const newFiles = [...files, ...selectedFiles]
    onFilesChange(newFiles)
    e.target.value = ""
  }

  const handleCameraCapture = (file: File) => {
    onFilesChange([...files, file])
  }

  const removeFile = (indexToRemove: number) => {
    const newFiles = files.filter((_, index) => index !== indexToRemove)
    const newPreviews = previews.filter((_, index) => index !== indexToRemove)
    onFilesChange(newFiles)
    setPreviews(newPreviews)
  }

  const triggerFileInput = () => {
    document.getElementById("file-upload")?.click()
  }

  return (
    <div className="flex flex-col">
      <div className="border-border h-50 relative overflow-hidden rounded-b-lg border-2 border-t-0 border-dashed">
        {previews.length === 0 ? (
          // Empty state - show upload area
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2">
            <label htmlFor="file-upload" className="flex cursor-pointer items-center gap-2">
              <ImageUp className="text-muted-foreground h-8 w-8" />
              <span className="text-sm text-muted-foreground">Click to select images</span>
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 flex items-center gap-1 bg-transparent"
              onClick={() => setCameraOpen(true)}
            >
              <Camera className="h-5 w-5" />
              Use Camera
            </Button>
          </div>
        ) : (
          // Preview grid with split add button
          <div className="flex flex-col p-2 h-full">
            <div className="grid grid-cols-3 gap-2 flex-1 overflow-y-auto">
              {previews.map((item, index) => (
                <div key={index} className="relative group">
                  <div className="w-full h-20 relative rounded-lg overflow-hidden border">
                    <Image
                      src={item.preview || "/placeholder.svg"}
                      alt={`Preview ${index + 1}`}
                      className="object-cover h-full w-full"
                      fill
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-destructive/90 hover:bg-destructive shadow-lg"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Split button for files and camera */}
              <div className="w-full h-20 border-2 border-dashed border-muted-foreground/50 rounded-lg overflow-hidden flex">
                {/* File upload half */}
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="flex-1 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <ImageUp className="size-4" />
                </button>

                {/* Divider */}
                <div className="w-px bg-border" />

                {/* Camera half */}
                <button
                  type="button"
                  onClick={() => setCameraOpen(true)}
                  className="flex-1 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <Camera className="size-4" />
                </button>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {files.length} file{files.length !== 1 ? "s" : ""} selected
            </div>
          </div>
        )}
        <input id="file-upload" type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
        {/* Camera Modal */}
        <CameraModal open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={handleCameraCapture} />
      </div>
    </div>
  )
}

export default UploadSampleFile
