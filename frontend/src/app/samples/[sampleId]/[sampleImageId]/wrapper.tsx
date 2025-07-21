"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Ellipsis,
  PlusIcon,
  Search,
  Bot,
  ImageIcon,
  Calendar,
  Ruler,
  Eye,
  Sparkles,
  Zap,
  Users,
  FileImage,
  Activity,
  Share2,
  Copy,
  Link,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import ProfileCard from "../../../../components/samples/profile-card"
import type { MetaSample, MetaSampleImage } from "../../types"
import SampleImageContainer from "./sample-image-container"
import type { User } from "@supabase/supabase-js"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { handleCopySampleId, handleDeleteSample } from "../../../../components/samples/sample-card"
import SampleDrawer from "@/components/samples/upload-sample-drawer"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import toast from "react-hot-toast"
import { useState, useEffect } from "react"
import DetectionResultDialog from "@/components/DetectionResultDialog"

interface SamplePageWrapperProps {
  currentUser: User
  sample: MetaSample | undefined
  sampleImages: MetaSampleImage[]
  selectedSampleImageId: string
}

async function handleDeleteSampleImage(sampleImageId: string, sampleId: string, router: any) {
  const toastId = toast.loading("Deleting sample image...")
  try {
    const { deleteSampleImage } = await import("@/actions/samples")
    const res = await deleteSampleImage(sampleImageId)
    if (res.success) {
      toast.success("Sample image deleted", { id: toastId })
      router.push(`/samples/${sampleId}`)
    } else {
      toast.error(res.error || "Failed to delete sample image", { id: toastId })
    }
  } catch (e) {
    toast.error("Failed to delete sample image", { id: toastId })
  }
}

const SamplePageWrapper = ({ currentUser, sample, sampleImages, selectedSampleImageId }: SamplePageWrapperProps) => {
  const selectedSampleImage = sampleImages.find((img) => img.id === selectedSampleImageId) || sampleImages[0]
  const router = useRouter()
  sample = sample!
  const sampleId = useParams()?.sampleId

  // Share dialog state
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [currentUrl, setCurrentUrl] = useState("")

  // Get current URL when component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href)
    }
  }, [])

  // Detection state
  const [selectedModel, setSelectedModel] = useState<string>("parasite_detection_yolov8")
  const [detectionResults, setDetectionResults] = useState<any>(null)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null)
  const [isResultModalOpen, setIsResultModalOpen] = useState(false)
  const [batchDetectionResults, setBatchDetectionResults] = useState<any>(null)
  const [batchAiAnalysis, setBatchAiAnalysis] = useState<any>(null)
  const [isBatchDetecting, setIsBatchDetecting] = useState(false)
  const [isBatchResultModalOpen, setIsBatchResultModalOpen] = useState(false)

  const getModelInfo = (modelName: string) => {
    const models = {
      parasite_detection_yolov8: {
        name: "Parasite Detection",
        icon: <Activity className="w-4 h-4" />,
        color: "bg-destructive",
        description: "Detects parasites in blood samples",
      },
      anemia_detection_yolov8: {
        name: "Anemia Detection",
        icon: <Eye className="w-4 h-4" />,
        color: "bg-orange-500",
        description: "Identifies anemia indicators",
      },
      malaria_detection_yolov8: {
        name: "Malaria Detection",
        icon: <Zap className="w-4 h-4" />,
        color: "bg-secondary",
        description: "Detects malaria parasites",
      },
    }
    return models[modelName as keyof typeof models] || models.parasite_detection_yolov8
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      toast.success("Link copied to clipboard!")
      setIsShareDialogOpen(false)
    } catch (error) {
      toast.error("Failed to copy link")
    }
  }

  const handleDetect = async () => {
    if (!selectedSampleImage?.imageUrl) {
      toast.error("No image available for detection")
      return
    }

    setIsDetecting(true)
    setDetectionResults(null)
    setAiAnalysis(null)
    setProcessedImageUrl(null)
    setIsResultModalOpen(false)

    try {
      toast.loading("Sending image for detection...")
      // Fetch the image as a blob
      const imageBlob = await fetch(selectedSampleImage.imageUrl).then((res) => res.blob())
      const formData = new FormData()
      formData.append("file", imageBlob, "image.jpg")

      // Call backend detection endpoint
      const response = await fetch(
        `http://127.0.0.1:8000/detect-and-analyze?model_name=${selectedModel}&sample_type=Blood%20smear&stain=Giemsa&magnification=1000x`,
        {
          method: "POST",
          body: formData,
        },
      )

      if (!response.ok) throw new Error("Detection failed")

      const resultData = await response.json()

      if (resultData.success) {
        setDetectionResults({
          detections: resultData.detections,
          total_detections: resultData.total_detections,
          detection_details: resultData.detection_details,
        })

        if (resultData.ai_analysis && resultData.ai_analysis.success) {
          setAiAnalysis(resultData.ai_analysis)
        }

        // Set processed image from base64 if available
        if (resultData.processed_image_base64) {
          setProcessedImageUrl(`data:image/jpeg;base64,${resultData.processed_image_base64}`)
        }

        toast.dismiss()
        toast.success("Detection and analysis complete!")
        setIsResultModalOpen(true)
      } else {
        throw new Error(resultData.error || "Detection failed")
      }
    } catch (error: any) {
      toast.dismiss()
      toast.error("Detection failed: " + error.message)
    } finally {
      setIsDetecting(false)
    }
  }

  const handleBatchDetect = async () => {
    if (!sampleImages.length) {
      toast.error("No images in sample")
      return
    }

    setIsBatchDetecting(true)
    setBatchDetectionResults(null)
    setBatchAiAnalysis(null)
    setIsBatchResultModalOpen(false)

    try {
      toast.loading("Sending all images for batch detection...")
      // Fetch all images as blobs
      const files: File[] = []
      for (const img of sampleImages) {
        if (!img.imageUrl) continue
        const blob = await fetch(img.imageUrl).then((res) => res.blob())
        files.push(new File([blob], "image.jpg", { type: blob.type }))
      }

      if (!files.length) throw new Error("No valid images to send")

      const formData = new FormData()
      files.forEach((file) => formData.append("files", file))

      // Call backend batch detection endpoint
      const response = await fetch(
        `http://127.0.0.1:8000/detect-and-analyze-batch?model_name=${selectedModel}&sample_type=Blood%20smear&stain=Giemsa&magnification=1000x`,
        {
          method: "POST",
          body: formData,
        },
      )

      if (!response.ok) throw new Error("Batch detection failed")

      const resultData = await response.json()

      if (resultData.success) {
        setBatchDetectionResults({
          detections: resultData.total_counts,
          total_detections: resultData.total_detections,
          per_image: resultData.results,
        })

        if (resultData.ai_analysis && resultData.ai_analysis.success) {
          setBatchAiAnalysis(resultData.ai_analysis)
        }

        toast.dismiss()
        toast.success("Batch detection and analysis complete!")
        setIsBatchResultModalOpen(true)
      } else {
        throw new Error(resultData.error || "Batch detection failed")
      }
    } catch (error: any) {
      toast.dismiss()
      toast.error("Batch detection failed: " + error.message)
    } finally {
      setIsBatchDetecting(false)
    }
  }

  const currentModel = getModelInfo(selectedModel)

  return (
    <div className="flex h-full w-full gap-6 p-6 bg-gradient-to-br from-background to-muted/20">
      {/* Main Image Container */}
      <div className="flex-1 overflow-hidden rounded-xl border-2 border-border shadow-xl bg-card">
        <SampleImageContainer currentUser={currentUser} sampleImage={selectedSampleImage!} />
      </div>

      {/* Enhanced Sidebar */}
      <div className="flex h-full flex-col w-[350px] space-y-4 min-h-0">
        {/* Sample Info Card */}
        <Card className="bg-card/80 backdrop-blur-sm border-2 border-border shadow-lg p-2">
          <CardHeader className="pb-1 px-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-1">
                <FileImage className="w-5 h-5 text-primary" />
                {sample.sampleName}
              </CardTitle>
              <div className="flex items-center gap-1">
                {/* Share Button */}
                <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted">
                      <Share2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Link className="w-5 h-5 text-primary" />
                        Share Sample
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Share this sample with others by copying the link below:
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="grid flex-1 gap-2">
                          <Input id="link" value={currentUrl} readOnly className="bg-muted/50 border-border" />
                        </div>
                        <Button onClick={handleCopyUrl} size="sm" className="px-3">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                        <Eye className="w-4 h-4" />
                        <span>Anyone with this link can view this sample</span>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Existing Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted">
                      <Ellipsis className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleCopySampleId(sample)}>Copy Sample ID</DropdownMenuItem>
                    {(currentUser.id == sample.createdBy?.id || currentUser.role == "Administrator") && (
                      <DropdownMenuItem
                        className="text-destructive hover:text-destructive/80"
                        onClick={() => handleDeleteSample(sample, router)}
                      >
                        Delete Sample
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 px-2 pb-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Created By</p>
                <ProfileCard profile={sample.createdBy!} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Patient</p>
                <ProfileCard profile={sample.patient!} />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <ImageIcon className="w-3 h-3 mr-1" />
                {sampleImages.length} Images
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                ID: {sample.id.slice(0, 8)}...
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Images Table Card */}
        <Card className="flex flex-col flex-1 min-h-0 bg-card/80 backdrop-blur-sm border-2 border-border shadow-lg overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-muted/50 to-primary/5">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              Sample Images
              <Badge variant="secondary">{sampleImages.length}</Badge>
              <div className="ml-auto">
                <SampleDrawer
                  trigger={
                    <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground flex w-8 h-8 cursor-pointer items-center justify-center rounded-lg hover:from-primary/90 hover:to-secondary/90 transition-all shadow-md">
                      <PlusIcon className="w-4 h-4" />
                    </div>
                  }
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 p-0">
            <ScrollArea className="flex-1 min-h-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-16"></TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Preview</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">
                      <Ruler className="w-3 h-3 inline mr-1" />
                      Size
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleImages.map((sampleImage) => (
                    <ContextMenu key={sampleImage.id}>
                      <ContextMenuTrigger asChild>
                        <TableRow
                          className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                            sampleImage.id == selectedSampleImage.id ? "bg-primary/10 border-l-4 border-primary" : ""
                          }`}
                          onClick={() => {
                            router.push(`/samples/${sampleId}/${sampleImage.id}`)
                          }}
                        >
                          <TableCell className="p-2">
                            <div className="relative">
                              <img
                                className="w-12 h-12 rounded-lg object-cover border-2 border-border shadow-sm"
                                src={sampleImage.imageUrl! || "/placeholder.svg"}
                                alt="Sample"
                              />
                              {sampleImage.id == selectedSampleImage.id && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                  <Eye className="w-2 h-2 text-primary-foreground" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {sampleImage.metadata.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {sampleImage.metadata.width} × {sampleImage.metadata.height}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(sampleImage.capturedAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                          onClick={async () => {
                            await navigator.clipboard.writeText(sampleImage.id)
                            toast.success("Sample image ID copied")
                          }}
                        >
                          Copy Sample Image ID
                        </ContextMenuItem>
                        <ContextMenuItem
                          className="text-destructive focus:text-destructive/80"
                          onClick={async () => {
                            await handleDeleteSampleImage(sampleImage.id, sample.id, router)
                          }}
                        >
                          Delete Sample Image
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Enhanced AI Actions Card */}
        <Card className="bg-gradient-to-br from-secondary/10 to-primary/5 border-2 border-secondary/20 shadow-lg p-2">
          <CardHeader className="pb-1 px-2">
            <CardTitle className="text-base font-semibold text-secondary-foreground flex items-center gap-1">
              <Bot className="w-5 h-5" />
              AI Analysis
              <Sparkles className="w-4 h-4 text-secondary ml-auto" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-2 pb-2 pt-1">
            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Detection Model</label>
              <Select disabled={isDetecting || isBatchDetecting} onValueChange={setSelectedModel} value={selectedModel}>
                <SelectTrigger className="bg-card border-secondary/20 focus:border-secondary">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${currentModel.color}`} />
                    <SelectValue placeholder="Choose model" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parasite_detection_yolov8">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-destructive" />
                      Parasite Detection
                    </div>
                  </SelectItem>
                  <SelectItem value="anemia_detection_yolov8">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-orange-500" />
                      Anemia Detection
                    </div>
                  </SelectItem>
                  <SelectItem value="malaria_detection_yolov8">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-secondary" />
                      Malaria Detection
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{currentModel.description}</p>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleDetect}
                disabled={isDetecting || isBatchDetecting}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                {isDetecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Analyze Current Image
                  </>
                )}
              </Button>

              <Button
                onClick={handleBatchDetect}
                disabled={isDetecting || isBatchDetecting}
                variant="outline"
                className="w-full border-2 border-secondary/20 hover:bg-secondary/10 text-secondary-foreground font-medium bg-transparent"
                size="lg"
              >
                {isBatchDetecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin mr-2" />
                    Analyzing All...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Analyze All Images ({sampleImages.length})
                  </>
                )}
              </Button>
            </div>

            {/* Status Indicator */}
            {(isDetecting || isBatchDetecting) && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-primary">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-sm font-medium">
                    {isDetecting ? "Processing single image..." : "Processing batch analysis..."}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Modals */}
        <DetectionResultDialog
          open={isResultModalOpen}
          onOpenChange={setIsResultModalOpen}
          detectionResults={detectionResults}
          aiAnalysis={aiAnalysis}
          processedImageUrl={processedImageUrl}
        />

        <DetectionResultDialog
          open={isBatchResultModalOpen}
          onOpenChange={setIsBatchResultModalOpen}
          detectionResults={batchDetectionResults}
          aiAnalysis={batchAiAnalysis}
          processedImageUrl={null}
          patientId={sample.patient?.id}
          sampleId={sample.id}
        />
      </div>
    </div>
  )
}

export default SamplePageWrapper
