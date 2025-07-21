"use client"

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ReactMarkdown from "react-markdown"
import { Eye, Brain, AlertCircle, CheckCircle2, ImageIcon, BarChart3 } from "lucide-react"

interface DetectionResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  detectionResults: any
  aiAnalysis: any
  processedImageUrl: string | null
}

const DetectionResultDialog: React.FC<DetectionResultDialogProps> = ({
  open,
  onOpenChange,
  detectionResults,
  aiAnalysis,
  processedImageUrl,
}) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[90vw] !max-w-6xl w-full p-0 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl shadow-2xl border-0">
        <div className="flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <Eye className="w-7 h-7" />
                Detection Results
              </DialogTitle>
              <p className="text-blue-100 mt-2">AI-powered image analysis and object detection</p>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Processed Image */}
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

            {/* Detection Results */}
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

            {/* AI Analysis */}
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
