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
import { useRouter, useParams } from "next/navigation"
import JSZip from "jszip"

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
  const params = useParams()
  const orgId = (params as any)?.organizationId || ""
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [viewMode, setViewMode] = useState<"grid" | "carousel">("grid")
  const [isExporting, setIsExporting] = useState(false)
  const [isBatchExporting, setIsBatchExporting] = useState(false)

  // Consistent neutral styling for all detected objects
  const getDetectionStyle = () => {
    return "bg-muted text-muted-foreground border-border hover:bg-muted/80"
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
          try {
            const blob = base64ToBlob(img.processed_image_base64)
            const filename = img.filename || `detected_image_${index + 1}.jpg`
            zip.file(filename, blob)
          } catch (error) {
            console.error(`Error adding image ${index + 1} to zip:`, error)
          }
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
      if (orgId) router.push(`/organizations/${orgId}/reports/ai-generate`)
      else router.push(`/reports/ai-generate`)
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
        {imageData.processed_image_base64 ? (
          <img
            src={`data:image/jpeg;base64,${imageData.processed_image_base64}`}
            alt={`Processed ${index + 1}`}
            className="w-full max-h-96 object-contain rounded-lg border bg-muted/30"
          />
        ) : (
          <div className="w-full h-96 flex items-center justify-center rounded-lg border bg-muted/30 text-muted-foreground">
            <div className="text-center">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Image not available</p>
              {imageData.error && <p className="text-sm text-destructive mt-1">{imageData.error}</p>}
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3 bg-background/95 text-foreground px-3 py-1.5 rounded-md text-sm font-medium border shadow-sm">
          <ImageIcon className="w-3 h-3 inline mr-1.5" />
          Image {index + 1}
        </div>
        {/* Export button for individual image */}
        {imageData.processed_image_base64 && (
          <div className="absolute top-3 right-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => downloadSingleImage(imageData.processed_image_base64, `detected_image_${index + 1}.jpg`)}
              disabled={isExporting}
              className="bg-background/95 hover:bg-background border shadow-sm"
            >
              {isExporting ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
              ) : (
                <Download className="w-3 h-3 mr-1.5" />
              )}
              Export
            </Button>
          </div>
        )}
      </div>
      {imageData.detections && Object.keys(imageData.detections).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Detections Found: {imageData.total_detections || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(imageData.detections).map(([cls, count]) => (
                <div
                  key={cls}
                  className={`${getDetectionStyle()} px-3 py-2.5 rounded-md border text-sm flex items-center justify-between transition-colors`}
                >
                  <span className="capitalize font-medium">{cls.replace("_", " ")}</span>
                  <Badge variant="secondary" className="text-xs font-semibold">
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
      <DialogContent className="!w-[95vw] !max-w-7xl w-full p-0 bg-background rounded-lg shadow-lg border">
        <div className="flex flex-col max-h-[90vh]">
          {/* Clean Header */}
          <div className="bg-primary text-primary-foreground p-6 rounded-t-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold flex items-center gap-3">
                <div className="p-2 bg-primary-foreground/20 rounded-md">
                  <Eye className="w-6 h-6" />
                </div>
                AI Detection Results
                {isBatch && (
                  <Badge
                    variant="secondary"
                    className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
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
                <div className="px-6 pt-6 pb-4 border-b bg-muted/30">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="images" className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Images ({images.length})
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      AI Analysis
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden">
                  <TabsContent value="overview" className="h-full m-0">
                    <ScrollArea className="h-full p-6">
                      <div className="space-y-6">
                        {/* Clean Summary Card */}
                        <Card>
                          <CardHeader className="border-b">
                            <CardTitle className="text-xl flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-md">
                                <BarChart3 className="w-5 h-5 text-primary" />
                              </div>
                              Detection Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                              <div className="bg-card border rounded-lg p-6 text-center">
                                <div className="text-3xl font-semibold mb-1 text-foreground">{images.length}</div>
                                <div className="text-muted-foreground text-sm font-medium">Images Processed</div>
                              </div>
                              <div className="bg-card border rounded-lg p-6 text-center">
                                <div className="text-3xl font-semibold mb-1 text-foreground">
                                  {detectionResults.total_detections}
                                </div>
                                <div className="text-muted-foreground text-sm font-medium">Total Detections</div>
                              </div>
                              <div className="bg-card border rounded-lg p-6 text-center">
                                <div className="text-3xl font-semibold mb-1 text-foreground">
                                  {detectionResults.detections ? Object.keys(detectionResults.detections).length : 0}
                                </div>
                                <div className="text-muted-foreground text-sm font-medium">Object Types</div>
                              </div>
                            </div>

                            {detectionResults.detections && (
                              <div className="space-y-4">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                  <Target className="w-5 h-5 text-primary" />
                                  Detected Objects Across All Images
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {Object.entries(detectionResults.detections).map(([cls, count]) => (
                                    <div
                                      key={cls}
                                      className={`${getDetectionStyle()} px-4 py-4 rounded-md border flex items-center justify-between transition-colors hover:bg-muted/60`}
                                    >
                                      <span className="font-semibold capitalize text-foreground">
                                        {cls.replace("_", " ")}
                                      </span>
                                      <Badge variant="secondary" className="font-semibold text-sm">
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
                                variant="outline"
                                size="lg"
                              >
                                {isBatchExporting ? (
                                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                ) : (
                                  <Archive className="w-5 h-5 mr-2" />
                                )}
                                {isBatchExporting ? "Creating ZIP..." : "Export All Images"}
                              </Button>
                              <Button onClick={handleGenerateReport} size="lg">
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
                    {/* Clean View Mode Toggle */}
                    <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between flex-shrink-0">
                      <h3 className="font-semibold flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-primary" />
                        Image Gallery
                      </h3>
                      <div className="flex items-center gap-4">
                        <Button
                          onClick={downloadAllImagesAsZip}
                          disabled={isBatchExporting}
                          size="sm"
                          variant="outline"
                        >
                          {isBatchExporting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Archive className="w-4 h-4 mr-2" />
                          )}
                          {isBatchExporting ? "Creating..." : "Export All"}
                        </Button>
                        <div className="flex items-center gap-2 bg-muted p-1 rounded-md">
                          <Button
                            variant={viewMode === "grid" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className="flex items-center gap-2"
                          >
                            <Grid3X3 className="w-4 h-4" />
                            Grid
                          </Button>
                          <Button
                            variant={viewMode === "carousel" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("carousel")}
                            className="flex items-center gap-2"
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
                                <Card key={idx} className="hover:shadow-md transition-shadow">
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
                              <div className="flex items-center justify-between bg-card p-4 rounded-lg border">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={prevImage}
                                  disabled={images.length <= 1}
                                  className="flex items-center gap-2 bg-transparent"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                  Previous
                                </Button>
                                <span className="text-sm text-muted-foreground font-medium bg-muted px-3 py-1 rounded-md">
                                  {selectedImageIndex + 1} of {images.length}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={nextImage}
                                  disabled={images.length <= 1}
                                  className="flex items-center gap-2 bg-transparent"
                                >
                                  Next
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              </div>
                              <Card>
                                <CardContent className="p-6">
                                  <SingleImageView imageData={images[selectedImageIndex]} index={selectedImageIndex} />
                                </CardContent>
                              </Card>
                              {/* Thumbnail Navigation */}
                              <div className="flex justify-center">
                                <div className="flex gap-3 overflow-x-auto pb-2 px-2">
                                  {images.map((img: any, idx: number) => (
                                    <button
                                      key={idx}
                                      onClick={() => setSelectedImageIndex(idx)}
                                      className={`flex-shrink-0 w-16 h-16 rounded-md border-2 overflow-hidden transition-all ${
                                        selectedImageIndex === idx
                                          ? "border-primary ring-2 ring-primary/20"
                                          : "border-border hover:border-primary/50"
                                      }`}
                                    >
                                      {img.processed_image_base64 ? (
                                        <img
                                          src={`data:image/jpeg;base64,${img.processed_image_base64}`}
                                          alt={`Thumb ${idx + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center">
                                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                      )}
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
                      {aiAnalysis ? (
                        <Card>
                          <CardHeader className="border-b">
                            <CardTitle className="text-xl flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-md">
                                <Brain className="w-5 h-5 text-primary" />
                              </div>
                              AI Medical Analysis
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            {aiAnalysis.success ? (
                              <div className="prose prose-gray max-w-none">
                                <div className="bg-muted/30 p-6 rounded-lg border">
                                  <div className="text-foreground leading-relaxed">
                                    <ReactMarkdown>{aiAnalysis.analysis}</ReactMarkdown>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
                                <div>
                                  <p className="font-semibold text-destructive">Analysis Error</p>
                                  <p className="text-destructive/80">{aiAnalysis.error || "Unknown error occurred"}</p>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ) : (
                        <Card>
                          <CardHeader className="border-b">
                            <CardTitle className="text-xl flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-md">
                                <Brain className="w-5 h-5 text-primary" />
                              </div>
                              AI Medical Analysis
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="flex items-center gap-3 p-6 bg-muted/30 border rounded-lg">
                              <AlertCircle className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-muted-foreground">Analysis Not Available</p>
                                <p className="text-muted-foreground/80">AI analysis was not generated for this batch.</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </div>
              </Tabs>
            ) : (
              // Clean Single Image Mode
              <ScrollArea className="h-full p-6">
                <div className="space-y-8">
                  {/* Single Processed Image */}
                  {processedImageUrl && (
                    <Card className="border-dashed border-primary/30">
                      <CardHeader className="pb-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-md">
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
                          variant="outline"
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
                        <div className="relative overflow-hidden rounded-lg border">
                          <img
                            src={processedImageUrl || "/placeholder.svg"}
                            alt="Processed"
                            className="w-full max-h-80 object-contain bg-muted/30"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Single Image Detection Results */}
                  {detectionResults && (
                    <Card>
                      <CardHeader className="border-b">
                        <CardTitle className="text-xl flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-md">
                            <BarChart3 className="w-5 h-5 text-primary" />
                          </div>
                          Detection Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold text-lg flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            {detectionResults.total_detections} Total Detections
                          </div>
                        </div>
                        {detectionResults.detections && (
                          <div className="space-y-4">
                            <h4 className="font-semibold text-lg flex items-center gap-2">
                              <Target className="w-5 h-5 text-primary" />
                              Detected Objects
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {Object.entries(detectionResults.detections).map(([cls, count]) => (
                                <div
                                  key={cls}
                                  className={`${getDetectionStyle()} px-4 py-4 rounded-md border flex items-center justify-between transition-colors hover:bg-muted/60`}
                                >
                                  <span className="font-semibold capitalize text-foreground">
                                    {cls.replace("_", " ")}
                                  </span>
                                  <Badge variant="secondary" className="font-semibold text-sm">
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

                  {/* Single Image AI Analysis */}
                  {aiAnalysis && (
                    <Card>
                      <CardHeader className="border-b">
                        <CardTitle className="text-xl flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-md">
                            <Brain className="w-5 h-5 text-primary" />
                          </div>
                          AI Medical Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        {aiAnalysis.success ? (
                          <div className="prose prose-gray max-w-none">
                            <div className="bg-muted/30 p-6 rounded-lg border">
                              <div className="text-foreground leading-relaxed">
                                <ReactMarkdown>{aiAnalysis.analysis}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
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

          {/* Clean Footer */}
          <div className="p-6 bg-muted/30 border-t rounded-b-lg">
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)} className="w-full" size="lg">
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
