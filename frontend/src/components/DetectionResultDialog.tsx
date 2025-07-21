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
} from "lucide-react"
import { useRouter } from "next/navigation"

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

  const getDetectionColor = (index: number) => {
    const colors = [
      "bg-blue-100 text-blue-800 border-blue-200",
      "bg-green-100 text-green-800 border-green-200",
      "bg-purple-100 text-purple-800 border-purple-200",
      "bg-orange-100 text-orange-800 border-orange-200",
      "bg-pink-100 text-pink-800 border-pink-200",
      "bg-indigo-100 text-indigo-800 border-indigo-200",
      "bg-teal-100 text-teal-800 border-teal-200",
      "bg-red-100 text-red-800 border-red-200",
    ]
    return colors[index % colors.length]
  }

  // Batch mode: detectionResults.per_image exists
  const isBatch = detectionResults && detectionResults.per_image
  const images = isBatch ? detectionResults.per_image : []

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
    <div className="space-y-4">
      <div className="relative">
        <img
          src={`data:image/jpeg;base64,${imageData.processed_image_base64}`}
          alt={`Processed ${index + 1}`}
          className="w-full max-h-96 object-contain rounded-lg border-2 border-gray-200 bg-gray-50"
        />
        <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
          Image {index + 1}
        </div>
      </div>

      {imageData.detections && Object.keys(imageData.detections).length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Detections: {imageData.total_detections || 0}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(imageData.detections).map(([cls, count], detIndex) => (
              <div
                key={cls}
                className={`${getDetectionColor(detIndex)} px-3 py-2 rounded-md text-sm flex items-center justify-between`}
              >
                <span className="capitalize font-medium">{cls.replace("_", " ")}</span>
                <Badge variant="secondary" className="bg-white/90 text-xs">
                  {count as number}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[95vw] !max-w-7xl w-full p-0 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl shadow-2xl border-0">
        <div className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <Eye className="w-7 h-7" />
                Detection Results
                {isBatch && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {images.length} Images
                  </Badge>
                )}
              </DialogTitle>
              <p className="text-blue-100 mt-2">
                {isBatch
                  ? `AI-powered batch analysis of ${images.length} images`
                  : "AI-powered image analysis and object detection"}
              </p>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {isBatch ? (
              <Tabs defaultValue="overview" className="h-full flex flex-col min-h-0">
                <div className="px-6 pt-4 border-b border-gray-200 bg-white/50">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
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
                        {/* Overall Summary */}
                        <Card className="bg-white/70 backdrop-blur-sm border-green-200 border-2">
                          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                            <CardTitle className="text-xl flex items-center gap-2 text-green-800">
                              <BarChart3 className="w-6 h-6" />
                              Overall Detection Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{images.length}</div>
                                <div className="text-blue-100">Images Processed</div>
                              </div>
                              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{detectionResults.total_detections}</div>
                                <div className="text-green-100">Total Detections</div>
                              </div>
                              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">
                                  {detectionResults.detections ? Object.keys(detectionResults.detections).length : 0}
                                </div>
                                <div className="text-purple-100">Object Types</div>
                              </div>
                            </div>

                            {detectionResults.detections && (
                              <div>
                                <h4 className="font-semibold text-gray-700 mb-4 text-lg">
                                  Detected Objects (All Images):
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                  {Object.entries(detectionResults.detections).map(([cls, count], index) => (
                                    <div
                                      key={cls}
                                      className={`${getDetectionColor(index)} px-4 py-3 rounded-lg border-2 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow`}
                                    >
                                      <span className="font-medium capitalize">{cls.replace("_", " ")}</span>
                                      <Badge variant="secondary" className="bg-white/80 text-gray-700 font-bold">
                                        {count as number}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end mt-6">
                              <Button
                                onClick={handleGenerateReport}
                                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-600 transition-all flex items-center gap-2"
                              >
                                <FileText className="w-4 h-4" />
                                Generate Report
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="images" className="h-full m-0 flex flex-col">
                    {/* View Mode Toggle */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-white/50 flex items-center justify-between flex-shrink-0">
                      <h3 className="font-semibold text-gray-700">Image Gallery</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={viewMode === "grid" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode("grid")}
                          className="flex items-center gap-1"
                        >
                          <Grid3X3 className="w-4 h-4" />
                          Grid
                        </Button>
                        <Button
                          variant={viewMode === "carousel" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode("carousel")}
                          className="flex items-center gap-1"
                        >
                          <ImageIcon className="w-4 h-4" />
                          Carousel
                        </Button>
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
                                  className="bg-white/70 backdrop-blur-sm border-2 border-gray-200 hover:border-blue-300 transition-colors"
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
                            <div className="max-w-4xl mx-auto space-y-4">
                              <div className="flex items-center justify-between">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={prevImage}
                                  disabled={images.length <= 1}
                                  className="flex items-center gap-1 bg-transparent"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                  Previous
                                </Button>
                                <span className="text-sm text-gray-600 font-medium">
                                  {selectedImageIndex + 1} of {images.length}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={nextImage}
                                  disabled={images.length <= 1}
                                  className="flex items-center gap-1 bg-transparent"
                                >
                                  Next
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              </div>
                              <Card className="bg-white/70 backdrop-blur-sm border-2 border-gray-200">
                                <CardContent className="p-6">
                                  <SingleImageView imageData={images[selectedImageIndex]} index={selectedImageIndex} />
                                </CardContent>
                              </Card>
                              {/* Thumbnail Navigation */}
                              <div className="flex justify-center gap-2 overflow-x-auto pb-2">
                                <div className="flex gap-2">
                                  {images.map((_: any, idx: number) => (
                                    <button
                                      key={idx}
                                      onClick={() => setSelectedImageIndex(idx)}
                                      className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${
                                        selectedImageIndex === idx
                                          ? "border-blue-500 ring-2 ring-blue-200"
                                          : "border-gray-300 hover:border-gray-400"
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
                        <Card className="bg-white/70 backdrop-blur-sm border-purple-200 border-2">
                          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-lg">
                            <CardTitle className="text-xl flex items-center gap-2 text-purple-800">
                              <Brain className="w-6 h-6" />
                              AI Analysis
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            {aiAnalysis.success ? (
                              <div className="prose prose-gray max-w-none">
                                <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-6 rounded-lg border border-purple-200">
                                  <div className="text-gray-700 leading-relaxed">
                                    <ReactMarkdown>{aiAnalysis.analysis}</ReactMarkdown>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                                <div>
                                  <p className="font-semibold text-red-800">Analysis Error</p>
                                  <p className="text-red-600">{aiAnalysis.error}</p>
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
              // Single Image Mode
              <ScrollArea className="h-full p-6">
                <div className="space-y-6">
                  {/* Single Processed Image */}
                  {processedImageUrl && (
                    <Card className="border-2 border-dashed border-blue-200 bg-white/50 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
                          <ImageIcon className="w-5 h-5 text-blue-600" />
                          Processed Image
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="relative overflow-hidden rounded-lg border-2 border-gray-200">
                          <img
                            src={processedImageUrl || "/placeholder.svg"}
                            alt="Processed"
                            className="w-full max-h-80 object-contain bg-gray-50"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Single Image Detection Results */}
                  {detectionResults && (
                    <Card className="bg-white/70 backdrop-blur-sm border-green-200 border-2">
                      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                        <CardTitle className="text-xl flex items-center gap-2 text-green-800">
                          <BarChart3 className="w-6 h-6" />
                          Detection Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full font-semibold text-lg shadow-lg">
                            <CheckCircle2 className="w-5 h-5 inline mr-2" />
                            {detectionResults.total_detections} Total Detections
                          </div>
                        </div>

                        {detectionResults.detections && (
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-4 text-lg">Detected Objects:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {Object.entries(detectionResults.detections).map(([cls, count], index) => (
                                <div
                                  key={cls}
                                  className={`${getDetectionColor(index)} px-4 py-3 rounded-lg border-2 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow`}
                                >
                                  <span className="font-medium capitalize">{cls.replace("_", " ")}</span>
                                  <Badge variant="secondary" className="bg-white/80 text-gray-700 font-bold">
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
                    <Card className="bg-white/70 backdrop-blur-sm border-purple-200 border-2">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-lg">
                        <CardTitle className="text-xl flex items-center gap-2 text-purple-800">
                          <Brain className="w-6 h-6" />
                          AI Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        {aiAnalysis.success ? (
                          <div className="prose prose-gray max-w-none">
                            <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-4 rounded-lg border border-purple-200">
                              <div className="text-gray-700 leading-relaxed">
                                <ReactMarkdown>{aiAnalysis.analysis}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-red-800">Analysis Error</p>
                              <p className="text-red-600">{aiAnalysis.error}</p>
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

          {/* Footer */}
          <div className="p-6 bg-white/80 backdrop-blur-sm border-t border-gray-200 rounded-b-2xl">
            <DialogFooter>
              <Button
                onClick={() => onOpenChange(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
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
