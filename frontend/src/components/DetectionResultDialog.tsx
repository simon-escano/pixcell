"use client"
import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import ReactMarkdown from "react-markdown"
import {
  Eye,
  Brain,
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  FileText,
  Sparkles,
  Target,
  TrendingUp,
  Download,
  Archive,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import JSZip from 'jszip';

interface DetectionResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  detectionResults: any
  aiAnalysis: any
  processedImageUrl: string | null
  patientId?: string
  sampleId?: string
}

const DetectionResultDialog: React.FC<DetectionResultDialogProps> = ({
  open,
  onOpenChange,
  detectionResults,
  aiAnalysis,
  processedImageUrl,
  patientId,
  sampleId,
}) => {
  const router = useRouter()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [viewMode, setViewMode] = useState<"grid" | "carousel">("grid")
  const [isExporting, setIsExporting] = useState(false)
  const [isBatchExporting, setIsBatchExporting] = useState(false)

  // Consistent neutral styling for all detected objects
  const getDetectionStyle = () => {
    return "bg-muted/50 text-foreground border-border hover:bg-muted/70"
  }

  // Batch mode: detectionResults.per_image exists
  const isBatch = detectionResults && detectionResults.per_image
  const images = isBatch ? detectionResults.per_image : []

  // Function to convert base64 to blob
  const base64ToBlob = (base64: string, mimeType = "image/jpeg") => {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  // Function to download single image
  const downloadSingleImage = async (base64Image: string, filename: string) => {
    setIsExporting(true)
    try {
      const blob = base64ToBlob(base64Image)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading image:", error)
    } finally {
      setIsExporting(false)
    }
  }

  // Function to download all images as zip
  const downloadAllImagesAsZip = async () => {
    setIsBatchExporting(true)
    try {
      const zip = new JSZip()
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

      // Add each processed image to the zip
      images.forEach((img: any, index: number) => {
        if (img.processed_image_base64) {
          const blob = base64ToBlob(img.processed_image_base64)
          zip.file(`detected_image_${index + 1}.jpg`, blob)
        }
      })

      // Add a summary file with detection results
      const summaryData = {
        timestamp: new Date().toISOString(),
        totalImages: images.length,
        totalDetections: detectionResults.total_detections,
        detectionSummary: detectionResults.detections,
        patientId,
        sampleId,
      }
      zip.file("detection_summary.json", JSON.stringify(summaryData, null, 2))

      // Generate and download the zip file
      const content = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(content)
      const link = document.createElement("a")
      link.href = url
      link.download = `detection_results_${timestamp}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error creating zip file:", error)
    } finally {
      setIsBatchExporting(false)
    }
  }

  // Handler for generating report in batch mode
  const handleGenerateReport = () => {
    if (isBatch) {
      console.log("Saving to localStorage:", { detectionResults, aiAnalysis, patientId, sampleId })
      localStorage.setItem(
        "batchDetectionReportData",
        JSON.stringify({
          detectionResults,
          aiAnalysis,
          patientId,
          sampleId,
        }),
      )
      router.push("/reports/ai-generate")
    }
  }

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const SingleImageView = ({ imageData, index }: { imageData: any; index: number }) => (
    <div className="space-y-6">
      <div className="relative group">
        <img
          src={`data:image/jpeg;base64,${imageData.processed_image_base64}`}
          alt={`Processed ${index + 1}`}
          className="w-full max-h-96 object-contain rounded-xl border border-border bg-muted/30 shadow-lg"
        />
        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm text-foreground px-3 py-1.5 rounded-full text-sm font-medium border border-border shadow-sm">
          <ImageIcon className="w-3 h-3 inline mr-1.5" />
          Image {index + 1}
        </div>
        {/* Export button for individual image */}
        <div className="absolute top-3 right-3">
          <Button
            size="sm"
            onClick={() => downloadSingleImage(imageData.processed_image_base64, `detected_image_${index + 1}.jpg`)}
            disabled={isExporting}
            className="bg-background/90 backdrop-blur-sm text-foreground hover:bg-background border border-border shadow-sm hover:shadow-md transition-all duration-200"
          >
            {isExporting ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
            ) : (
              <Download className="w-3 h-3 mr-1.5" />
            )}
            Export
          </Button>
        </div>
      </div>
      {imageData.detections && Object.keys(imageData.detections).length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Detections Found: {imageData.total_detections || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(imageData.detections).map(([cls, count]) => (
                <div
                  key={cls}
                  className={`${getDetectionStyle()} px-3 py-2.5 rounded-lg border text-sm flex items-center justify-between transition-all hover:shadow-sm`}
                >
                  <span className="capitalize font-medium">{cls.replace("_", " ")}</span>
                  <Badge variant="secondary" className="bg-background/80 text-xs font-semibold">
                    {count as number}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[95vw] !max-w-7xl w-full p-0 bg-gradient-to-br from-background via-background to-muted/20 rounded-2xl shadow-2xl border border-border/50">
        <div className="flex flex-col max-h-[90vh]">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-primary via-primary to-secondary text-primary-foreground p-6 rounded-t-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/90" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Eye className="w-6 h-6" />
                </div>
                AI Detection Results
                {isBatch && (
                  <Badge
                    variant="secondary"
                    className="bg-white/20 text-primary-foreground border-white/30 backdrop-blur-sm"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {images.length} Images
                  </Badge>
                )}
              </DialogTitle>
              <p className="text-primary-foreground/80 mt-2 text-base">
                {isBatch
                  ? `Comprehensive AI analysis across ${images.length} medical images`
                  : "Advanced AI-powered medical image analysis and detection"}
              </p>
            </DialogHeader>
          </div>
          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {isBatch ? (
              <Tabs defaultValue="overview" className="h-full flex flex-col min-h-0">
                <div className="px-6 pt-6 pb-4 border-b border-border/50 bg-card/30 backdrop-blur-sm">
                  <TabsList className="grid w-full grid-cols-3 bg-muted/50 backdrop-blur-sm">
                    <TabsTrigger
                      value="overview"
                      className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="images"
                      className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Images ({images.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="analysis"
                      className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <Brain className="w-4 h-4" />
                      AI Analysis
                    </TabsTrigger>
                  </TabsList>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <TabsContent value="overview" className="h-full m-0">
                    <ScrollArea className="h-full p-6">
                      <div className="space-y-6">
                        {/* Enhanced Overall Summary */}
                        <Card className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-border/50 shadow-lg">
                          <CardHeader className="bg-gradient-to-r from-muted/30 to-muted/10 rounded-t-lg border-b border-border/30">
                            <CardTitle className="text-xl flex items-center gap-3 text-foreground">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <BarChart3 className="w-5 h-5 text-primary" />
                              </div>
                              Detection Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                              <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 rounded-xl text-center shadow-lg hover:shadow-xl transition-shadow">
                                <div className="text-3xl font-bold mb-1">{images.length}</div>
                                <div className="text-primary-foreground/80 text-sm font-medium">Images Processed</div>
                              </div>
                              <div className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground p-6 rounded-xl text-center shadow-lg hover:shadow-xl transition-shadow">
                                <div className="text-3xl font-bold mb-1">{detectionResults.total_detections}</div>
                                <div className="text-secondary-foreground/80 text-sm font-medium">Total Detections</div>
                              </div>
                              <div className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground p-6 rounded-xl text-center shadow-lg hover:shadow-xl transition-shadow">
                                <div className="text-3xl font-bold mb-1">
                                  {detectionResults.detections ? Object.keys(detectionResults.detections).length : 0}
                                </div>
                                <div className="text-accent-foreground/80 text-sm font-medium">Object Types</div>
                              </div>
                            </div>
                            {detectionResults.detections && (
                              <div className="space-y-4">
                                <h4 className="font-semibold text-foreground text-lg flex items-center gap-2">
                                  <Target className="w-5 h-5 text-primary" />
                                  Detected Objects Across All Images
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {Object.entries(detectionResults.detections).map(([cls, count]) => (
                                    <div
                                      key={cls}
                                      className={`${getDetectionStyle()} px-4 py-4 rounded-xl border-2 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105`}
                                    >
                                      <span className="font-semibold capitalize">{cls.replace("_", " ")}</span>
                                      <Badge
                                        variant="secondary"
                                        className="bg-background/90 text-foreground font-bold text-sm px-2 py-1"
                                      >
                                        {count as number}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex flex-col sm:flex-row gap-4 justify-end mt-8">
                              <Button
                                onClick={downloadAllImagesAsZip}
                                disabled={isBatchExporting}
                                className="bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                                size="lg"
                              >
                                {isBatchExporting ? (
                                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                ) : (
                                  <Archive className="w-5 h-5 mr-2" />
                                )}
                                {isBatchExporting ? "Creating ZIP..." : "Export All Images"}
                              </Button>
                              <Button
                                onClick={handleGenerateReport}
                                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                                size="lg"
                              >
                                <FileText className="w-5 h-5 mr-2" />
                                Generate Medical Report
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="images" className="h-full m-0 flex flex-col">
                    {/* Enhanced View Mode Toggle */}
                    <div className="px-6 py-4 border-b border-border/50 bg-card/30 backdrop-blur-sm flex items-center justify-between flex-shrink-0">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-primary" />
                        Image Gallery
                      </h3>
                      <div className="flex items-center gap-4">
                        <Button
                          onClick={downloadAllImagesAsZip}
                          disabled={isBatchExporting}
                          size="sm"
                          className="bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground font-medium px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          {isBatchExporting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Archive className="w-4 h-4 mr-2" />
                          )}
                          {isBatchExporting ? "Creating..." : "Export All"}
                        </Button>
                        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
                          <Button
                            variant={viewMode === "grid" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className="flex items-center gap-2 rounded-md"
                          >
                            <Grid3X3 className="w-4 h-4" />
                            Grid
                          </Button>
                          <Button
                            variant={viewMode === "carousel" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("carousel")}
                            className="flex items-center gap-2 rounded-md"
                          >
                            <ImageIcon className="w-4 h-4" />
                            Carousel
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0">
                      <ScrollArea className="h-full">
                        {viewMode === "grid" ? (
                          <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                              {images.map((img: any, idx: number) => (
                                <Card
                                  key={idx}
                                  className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group"
                                >
                                  <CardContent className="p-4">
                                    <SingleImageView imageData={img} index={idx} />
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="p-6">
                            <div className="max-w-4xl mx-auto space-y-6">
                              <div className="flex items-center justify-between bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-border/50">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={prevImage}
                                  disabled={images.length <= 1}
                                  className="flex items-center gap-2 bg-background/50 backdrop-blur-sm"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                  Previous
                                </Button>
                                <span className="text-sm text-muted-foreground font-medium bg-muted/50 px-3 py-1 rounded-full">
                                  {selectedImageIndex + 1} of {images.length}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={nextImage}
                                  disabled={images.length <= 1}
                                  className="flex items-center gap-2 bg-background/50 backdrop-blur-sm"
                                >
                                  Next
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              </div>
                              <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
                                <CardContent className="p-6">
                                  <SingleImageView imageData={images[selectedImageIndex]} index={selectedImageIndex} />
                                </CardContent>
                              </Card>
                              {/* Enhanced Thumbnail Navigation */}
                              <div className="flex justify-center">
                                <div className="flex gap-3 overflow-x-auto pb-2 px-2">
                                  {images.map((_: any, idx: number) => (
                                    <button
                                      key={idx}
                                      onClick={() => setSelectedImageIndex(idx)}
                                      className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all duration-200 hover:scale-110 ${
                                        selectedImageIndex === idx
                                          ? "border-primary ring-2 ring-primary/20 shadow-lg"
                                          : "border-border hover:border-primary/50"
                                      }`}
                                    >
                                      <img
                                        src={`data:image/jpeg;base64,${images[idx].processed_image_base64}`}
                                        alt={`Thumb ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </TabsContent>
                  <TabsContent value="analysis" className="h-full m-0">
                    <ScrollArea className="h-full p-6">
                      {aiAnalysis && (
                        <Card className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-border/50 shadow-lg">
                          <CardHeader className="bg-gradient-to-r from-secondary/10 to-primary/5 rounded-t-lg border-b border-border/30">
                            <CardTitle className="text-xl flex items-center gap-3 text-foreground">
                              <div className="p-2 bg-secondary/10 rounded-lg">
                                <Brain className="w-5 h-5 text-secondary" />
                              </div>
                              AI Medical Analysis
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            {aiAnalysis.success ? (
                              <div className="prose prose-gray max-w-none">
                                <div className="bg-gradient-to-br from-muted/30 to-muted/10 p-6 rounded-xl border border-border/30 backdrop-blur-sm">
                                  <div className="text-foreground leading-relaxed">
                                    <ReactMarkdown>{aiAnalysis.analysis}</ReactMarkdown>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 p-6 bg-destructive/10 border border-destructive/20 rounded-xl">
                                <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
                                <div>
                                  <p className="font-semibold text-destructive">Analysis Error</p>
                                  <p className="text-destructive/80">{aiAnalysis.error}</p>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </div>
              </Tabs>
            ) : (
              // Enhanced Single Image Mode
              <ScrollArea className="h-full p-6">
                <div className="space-y-8">
                  {/* Single Processed Image */}
                  {processedImageUrl && (
                    <Card className="border-2 border-dashed border-primary/30 bg-card/30 backdrop-blur-sm shadow-lg">
                      <CardHeader className="pb-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-3 text-foreground">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <ImageIcon className="w-5 h-5 text-primary" />
                          </div>
                          Processed Medical Image
                        </CardTitle>
                        <Button
                          onClick={() => {
                            // Extract base64 from data URL
                            const base64 = processedImageUrl.split(",")[1]
                            downloadSingleImage(base64, "detected_image.jpg")
                          }}
                          disabled={isExporting}
                          className="bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground font-medium px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          {isExporting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 mr-2" />
                          )}
                          Export Image
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="relative overflow-hidden rounded-xl border border-border shadow-lg group">
                          <img
                            src={processedImageUrl || "/placeholder.svg"}
                            alt="Processed"
                            className="w-full max-h-80 object-contain bg-muted/30 transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {/* Enhanced Single Image Detection Results */}
                  {detectionResults && (
                    <Card className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-border/50 shadow-lg">
                      <CardHeader className="bg-gradient-to-r from-muted/30 to-muted/10 rounded-t-lg border-b border-border/30">
                        <CardTitle className="text-xl flex items-center gap-3 text-foreground">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-primary" />
                          </div>
                          Detection Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-lg shadow-lg flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            {detectionResults.total_detections} Total Detections
                          </div>
                        </div>
                        {detectionResults.detections && (
                          <div className="space-y-4">
                            <h4 className="font-semibold text-foreground text-lg flex items-center gap-2">
                              <Target className="w-5 h-5 text-primary" />
                              Detected Objects
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {Object.entries(detectionResults.detections).map(([cls, count]) => (
                                <div
                                  key={cls}
                                  className={`${getDetectionStyle()} px-4 py-4 rounded-xl border-2 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105`}
                                >
                                  <span className="font-semibold capitalize">{cls.replace("_", " ")}</span>
                                  <Badge
                                    variant="secondary"
                                    className="bg-background/90 text-foreground font-bold text-sm px-2 py-1"
                                  >
                                    {count as number}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  {/* Enhanced Single Image AI Analysis */}
                  {aiAnalysis && (
                    <Card className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-border/50 shadow-lg">
                      <CardHeader className="bg-gradient-to-r from-secondary/10 to-primary/5 rounded-t-lg border-b border-border/30">
                        <CardTitle className="text-xl flex items-center gap-3 text-foreground">
                          <div className="p-2 bg-secondary/10 rounded-lg">
                            <Brain className="w-5 h-5 text-secondary" />
                          </div>
                          AI Medical Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        {aiAnalysis.success ? (
                          <div className="prose prose-gray max-w-none">
                            <div className="bg-gradient-to-br from-muted/30 to-muted/10 p-6 rounded-xl border border-border/30 backdrop-blur-sm">
                              <div className="text-foreground leading-relaxed">
                                <ReactMarkdown>{aiAnalysis.analysis}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-6 bg-destructive/10 border border-destructive/20 rounded-xl">
                            <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-destructive">Analysis Error</p>
                              <p className="text-destructive/80">{aiAnalysis.error}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
          {/* Enhanced Footer */}
          <div className="p-6 bg-card/50 backdrop-blur-sm border-t border-border/50 rounded-b-2xl">
            <DialogFooter>
              <Button
                onClick={() => onOpenChange(false)}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                Close Results
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DetectionResultDialog
