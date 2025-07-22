"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { CircleDot, Camera, RotateCcw, Check, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialogForCamera"
import { cn } from "@/utils"

interface CameraModalProps {
  open: boolean
  onClose: () => void
  onCapture: (file: File) => void
}

export default function CameraModal({ open, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string>("")
  const [capturedImage, setCapturedImage] = useState<{ blob: Blob; previewUrl: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setError("")
    } catch (err) {
      setError("Could not access camera. Please make sure you have granted camera permissions.")
      console.error("Camera error:", err)
    }
  }, [stream])

  useEffect(() => {
    if (open) {
      startCamera()
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      setCapturedImage(null)
      setError("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const capturePhoto = () => {
    if (!videoRef.current) return
    const canvas = document.createElement("canvas")
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(videoRef.current, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const previewUrl = URL.createObjectURL(blob)
          setCapturedImage({ blob, previewUrl })
        }
      },
      "image/jpeg",
      0.9,
    )
  }

  const handleRetake = async () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.previewUrl)
      setCapturedImage(null)
      await startCamera()
    }
  }

  const handleConfirm = () => {
    if (capturedImage) {
      setIsLoading(true)
      const file = new File([capturedImage.blob], `camera-capture-${Date.now()}.jpg`, { type: "image/jpeg" })
      onCapture(file)
      setIsLoading(false)
      onClose()
      URL.revokeObjectURL(capturedImage.previewUrl)
      setCapturedImage(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] p-0 overflow-hidden bg-background border-border">
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/30">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="p-2 rounded-full bg-primary/10">
              <Camera className="h-4 w-4 text-primary" />
            </div>
            Camera Capture
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col p-6">
          <div className="flex items-center justify-center">
            <div className="relative w-full aspect-video bg-muted/50 flex items-center justify-center rounded-2xl overflow-hidden border-2 border-border shadow-xl">
              {error ? (
                <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
                  <div className="p-4 rounded-full bg-destructive/10 mb-4">
                    <X className="h-8 w-8 text-destructive" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Camera Access Required</h3>
                  <p className="text-muted-foreground leading-relaxed">{error}</p>
                  <Button onClick={startCamera} className="mt-6 bg-transparent" variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : capturedImage ? (
                <div className="relative w-full h-full">
                  <img
                    src={capturedImage.previewUrl || "/placeholder.svg"}
                    alt="Captured sample"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                  {/* Camera overlay UI */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Corner guides */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-white/60 rounded-tl-lg" />
                    <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-white/60 rounded-tr-lg" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-white/60 rounded-bl-lg" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-white/60 rounded-br-lg" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-4 mt-6">
            {capturedImage ? (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleRetake}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 h-auto bg-transparent"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retake Photo
                </Button>
                <Button
                  size="lg"
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={cn(
                    "flex items-center gap-2 px-8 py-3 h-auto font-semibold",
                    "bg-primary hover:bg-primary/90 text-primary-foreground",
                    "shadow-lg hover:shadow-xl transition-all duration-200",
                  )}
                >
                  <Check className="h-4 w-4" />
                  {isLoading ? "Processing..." : "Use This Photo"}
                </Button>
              </>
            ) : (
              !error && (
                <Button
                  size="lg"
                  onClick={capturePhoto}
                  className={cn(
                    "rounded-full w-16 h-16 p-0 shadow-2xl",
                    "bg-primary hover:bg-primary/90 text-primary-foreground",
                    "border-4 border-background",
                    "transition-all duration-200 hover:scale-105",
                    "focus:ring-4 focus:ring-primary/30",
                  )}
                  aria-label="Capture photo"
                >
                  <CircleDot className="h-6 w-6 animate-pulse" />
                </Button>
              )
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
