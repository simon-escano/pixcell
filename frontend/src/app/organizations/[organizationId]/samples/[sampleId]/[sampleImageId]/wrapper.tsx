"use client"

import DetectionResultDialog from "@/components/DetectionResultDialog"
import UserButton from "@/components/members/user-button"
import SampleDrawer from "@/components/samples/upload-sample-drawer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePageSidebar } from "@/contexts/page-sidebar-context"
import { format } from "date-fns"
import {
  Activity,
  Edit,
  Ellipsis,
  Eye,
  ImageIcon,
  Images,
  Loader2,
  MicroscopeIcon,
  Share2,
  Sparkles,
  Zap
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { MetaSample, MetaSampleImage } from "../../types"
import SampleImageContainer from "./sample-image-container"

interface SamplePageWrapperProps {
  sample: MetaSample | undefined
  sampleImages: MetaSampleImage[]
  selectedSampleImageId: string
  canEdit?: boolean;
  aiImagesRecord?: Record<string, string | null>;
}

async function handleDeleteSampleImage(sampleImageId: string, sampleId: string, router: any, orgId: string) {
  const toastId = toast.loading("Deleting sample image...")
  try {
    const { deleteSampleImage } = await import("@/actions/samples")
    const res = await deleteSampleImage(sampleImageId)
      if (res.success) {
        toast.success("Sample image deleted", { id: toastId })
        router.push(`/organizations/${orgId}/samples/${sampleId}`)
    } else {
      toast.error(res.error || "Failed to delete sample image", { id: toastId })
    }
  } catch (e) {
    toast.error("Failed to delete sample image", { id: toastId })
  }
}

const SamplePageWrapper = ({ sample, sampleImages, selectedSampleImageId, canEdit, aiImagesRecord = {} }: SamplePageWrapperProps) => {
  const selectedSampleImage = sampleImages.find((img) => img.id === selectedSampleImageId) || sampleImages[0]
  const router = useRouter()
  const params = useParams()
  sample = sample!
  const sampleId = params?.sampleId as string
  const orgId = params?.organizationId as string
  
  // Local state for AI images (can be updated immediately after saving)
  const [localAiImagesRecord, setLocalAiImagesRecord] = useState<Record<string, string | null>>(aiImagesRecord)
  
  // Update local state when prop changes (e.g., after page refresh)
  useEffect(() => {
    setLocalAiImagesRecord(aiImagesRecord)
  }, [aiImagesRecord])

  // Share dialog state
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [currentUrl, setCurrentUrl] = useState("")
  
  // Edit drawer state
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)

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

      // Call detection endpoint through Next.js API proxy (avoids CORS issues)
      const endpoint = new URL('/api/detection/detect-and-analyze', window.location.origin)
      endpoint.searchParams.append('model_name', selectedModel)
      endpoint.searchParams.append('sample_type', 'Blood smear')
      endpoint.searchParams.append('stain', 'Giemsa')
      endpoint.searchParams.append('magnification', '1000x')
      
      console.log('Calling detection endpoint:', endpoint.toString())
      
      const response = await fetch(endpoint.toString(), {
        method: "POST",
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary for FormData
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Detection failed:", {
          status: response.status,
          statusText: response.statusText,
          url: endpoint,
          errorText: errorText.substring(0, 500)
        })
        throw new Error(`Detection failed: ${response.status} ${response.statusText}. ${errorText.substring(0, 200)}`)
      }

      const resultData = await response.json()

      if (resultData.success) {
        setDetectionResults({
          detections: resultData.detections,
          total_detections: resultData.total_detections,
          detection_details: resultData.detection_details,
        })

        // Always set AI analysis if it exists (including error cases)
        if (resultData.ai_analysis) {
          setAiAnalysis(resultData.ai_analysis)
        } else {
          setAiAnalysis(null)
        }

        // Set processed image from base64 if available
        if (resultData.processed_image_base64) {
          setProcessedImageUrl(`data:image/jpeg;base64,${resultData.processed_image_base64}`)
          
          // Save AI-generated image to database
          if (selectedSampleImage) {
            try {
              const formData = new FormData();
              formData.append('originalSampleImageId', selectedSampleImage.id);
              formData.append('imageBase64', `data:image/jpeg;base64,${resultData.processed_image_base64}`);
              
              const saveResponse = await fetch('/api/samples/save-ai-image', {
                method: 'POST',
                body: formData,
              });
              
              if (!saveResponse.ok) {
                const errorData = await saveResponse.json().catch(() => ({ error: 'Unknown error' }));
                console.error(`Failed to save AI image for sample image ${selectedSampleImage.id}:`, errorData.error || saveResponse.statusText);
                toast.error(`Failed to save AI image: ${errorData.error || saveResponse.statusText}`);
              } else {
                const saveResult = await saveResponse.json();
                // Update local state immediately to show AI view
                if (saveResult.aiImage?.imageUrl) {
                  setLocalAiImagesRecord(prev => ({
                    ...prev,
                    [selectedSampleImage.id]: saveResult.aiImage.imageUrl
                  }));
                }
                // Also refresh to ensure consistency
                router.refresh();
              }
            } catch (error) {
              console.error(`Error saving AI image for sample image ${selectedSampleImage.id}:`, error);
            }
          }
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

      // Call batch detection endpoint through Next.js API proxy (avoids CORS issues)
      const endpoint = new URL('/api/detection/detect-and-analyze-batch', window.location.origin)
      endpoint.searchParams.append('model_name', selectedModel)
      endpoint.searchParams.append('sample_type', 'Blood smear')
      endpoint.searchParams.append('stain', 'Giemsa')
      endpoint.searchParams.append('magnification', '1000x')
      
      console.log('Calling batch detection endpoint:', endpoint.toString())
      
      const response = await fetch(endpoint.toString(), {
        method: "POST",
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary for FormData
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Batch detection failed:", {
          status: response.status,
          statusText: response.statusText,
          url: endpoint,
          errorText: errorText.substring(0, 500)
        })
        throw new Error(`Batch detection failed: ${response.status} ${response.statusText}. ${errorText.substring(0, 200)}`)
      }

      const resultData = await response.json()
      console.log("Batch detection response:", resultData)
      console.log("AI Analysis in response:", resultData.ai_analysis)

      if (resultData.success) {
        setBatchDetectionResults({
          detections: resultData.total_counts,
          total_detections: resultData.total_detections,
          per_image: resultData.results,
        })

        // Always set AI analysis if it exists (including error cases)
        if (resultData.ai_analysis) {
          console.log("Setting batch AI analysis:", resultData.ai_analysis)
          setBatchAiAnalysis(resultData.ai_analysis)
        } else {
          console.log("No AI analysis in response, setting to null")
          setBatchAiAnalysis(null)
        }

        // Save AI-generated images to database
        if (resultData.results && Array.isArray(resultData.results)) {
          const updatedAiImages: Record<string, string | null> = { ...localAiImagesRecord };
          
          const savePromises = resultData.results.map(async (result: any, index: number) => {
            if (result.processed_image_base64 && sampleImages[index]) {
              try {
                const formData = new FormData();
                formData.append('originalSampleImageId', sampleImages[index].id);
                formData.append('imageBase64', `data:image/jpeg;base64,${result.processed_image_base64}`);
                
                const saveResponse = await fetch('/api/samples/save-ai-image', {
                  method: 'POST',
                  body: formData,
                });
                
                if (!saveResponse.ok) {
                  const errorData = await saveResponse.json().catch(() => ({ error: 'Unknown error' }));
                  console.error(`Failed to save AI image for sample image ${sampleImages[index].id}:`, errorData.error || saveResponse.statusText);
                } else {
                  const saveResult = await saveResponse.json();
                  if (saveResult.aiImage?.imageUrl) {
                    updatedAiImages[sampleImages[index].id] = saveResult.aiImage.imageUrl;
                  }
                }
              } catch (error) {
                console.error(`Error saving AI image for sample image ${sampleImages[index].id}:`, error);
              }
            }
          });
          
          await Promise.all(savePromises);
          
          // Update local state immediately to show AI images
          setLocalAiImagesRecord(updatedAiImages);
          
          // Also refresh to ensure consistency
          router.refresh();
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
  
  // Sidebar collapse state from context
  const { isSidebarOpen, setIsSidebarOpen, setHasSidebar } = usePageSidebar()
  
  // Set hasSidebar to true when component mounts
  useEffect(() => {
    setHasSidebar(true)
    return () => setHasSidebar(false)
  }, [setHasSidebar])
  
  // AI view toggle state
  const currentAiImageUrl = localAiImagesRecord[selectedSampleImage!.id] || null
  const hasAiImage = !!currentAiImageUrl
  const [showAiImage, setShowAiImage] = useState(!!currentAiImageUrl)
  
  // Update to AI view when AI image becomes available or when selected sample image changes
  useEffect(() => {
    if (currentAiImageUrl) {
      setShowAiImage(true)
    } else {
      setShowAiImage(false)
    }
  }, [currentAiImageUrl, selectedSampleImage.id])

  return (
    <div className="flex h-full w-full relative">
      {/* Main Image Container */}
      <div className="flex-1 overflow-hidden">
        <SampleImageContainer 
          sampleImage={selectedSampleImage!} 
          canEdit={canEdit}
          aiImageUrl={currentAiImageUrl}
          showAiImage={showAiImage}
          onShowAiImageChange={setShowAiImage}
        />
      </div>

      {/* Enhanced Sidebar */}
      <div className={`flex border-l h-full flex-col w-[350px] min-h-0 transition-all duration-300 ${isSidebarOpen ? '' : 'hidden'}`}>
        {/* Sample Info Card */}
        <div className="flex flex-col p-6 gap-3 border-b">
          <div className="flex justify-between gap-2 items-center">
            <div className="flex gap-2.5 items-center">
              <ImageIcon className="size-4 text-inset-icon"></ImageIcon>
              <p className="text-base font-medium">{sample.sampleName}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Ellipsis className="size-4 text-inset-icon" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsShareDialogOpen(true)}>
                  <Share2 className="w-4 h-4" />
                  Share
                </DropdownMenuItem>
                {canEdit && (
                  <DropdownMenuItem onClick={() => setIsEditDrawerOpen(true)}>
                    <Edit className="w-4 h-4" />
                    Edit
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-muted-foreground">Patient</p>
              <UserButton 
                imageUrl={sample.patient?.imageUrl || ""}
                firstName={sample.patient?.fullName.split(" ")[0] || ""}
                lastName={sample.patient?.fullName.split(" ")[1] || ""}
                redirectUrl={`/organizations/${orgId}/members/${sample.patient?.id}`}
                roleName={"Patient"}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-muted-foreground">Owner</p>
              <UserButton 
                imageUrl={sample.createdBy?.imageUrl || ""}
                firstName={sample.createdBy?.fullName.split(" ")[0] || ""}
                lastName={sample.createdBy?.fullName.split(" ")[1] || ""}
                redirectUrl={`/organizations/${orgId}/members/${sample.createdBy?.id}`}
                roleName={"Created By"}
              />
            </div>
          </div>
        </div>

        {/* Images Table */}
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="flex-1 min-h-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-auto pl-4 py-2 text-xs text-muted-foreground">Preview</TableHead>
                  <TableHead className="h-auto py-2 text-xs text-muted-foreground">Size</TableHead>
                  <TableHead className="h-auto pr-4 py-2 text-xs text-muted-foreground">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleImages.map((sampleImage) => {
                  // Extract file extension from imageUrl or use metadata.type
                  const getFileExtension = () => {
                    if (sampleImage.imageUrl) {
                      const match = sampleImage.imageUrl.match(/\.([a-zA-Z0-9]+)(\?|$)/);
                      if (match) return match[1].toUpperCase();
                    }
                    return sampleImage.metadata.type || 'IMG';
                  };
                  
                  return (
                    <ContextMenu key={sampleImage.id}>
                      <ContextMenuTrigger asChild>
                        <TableRow
                          className={`h-[50px] cursor-pointer hover:bg-muted/50 transition-colors ${
                            sampleImage.id == selectedSampleImage.id ? "bg-inset-active" : ""
                          }`}
                          onClick={() => {
                            router.push(`/organizations/${orgId}/samples/${sampleId}/${sampleImage.id}`)
                          }}
                        >
                          <TableCell className="pl-4 py-2">
                            <div className="relative flex items-center gap-2">
                              <img
                                className="w-10 h-10 rounded-lg object-cover border border-border"
                                src={sampleImage.imageUrl! || "/placeholder.svg"}
                                alt="Sample"
                              />
                              <Badge 
                                className="text-[10px] px-1.5 py-0.5 gap-1.5 rounded-sm bg-card border border-card-border"
                              >
                                {getFileExtension()}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {sampleImage.metadata.width} × {sampleImage.metadata.height}
                          </TableCell>
                          <TableCell className="text-sm pr-4">
                            {format(new Date(sampleImage.capturedAt), "MMM d")}
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
                        {
                          canEdit && (
                          <ContextMenuItem
                            className="text-destructive focus:text-destructive/80"
                            onClick={async () => {
                              await handleDeleteSampleImage(sampleImage.id, sample.id, router, orgId)
                            }}
                          >
                            Delete Sample Image
                          </ContextMenuItem>)
                        }
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Enhanced AI Actions Card */}
        <div className="p-3.5">
          <div className="flex flex-col p-3 rounded-md bg-card border border-ai-border gap-3 shadow-lg" style={{ boxShadow: '0 0 20px rgba(147, 51, 234, 0.15)' }}>
            <div className="flex justify-between gap-2 items-center">
              <div className="flex gap-2.5 items-center">
                <Sparkles className="size-4 text-ai-icon" />
                <p className="text-base font-medium text-ai-foreground">AI Analysis</p>
              </div>
              <div className="flex gap-2 items-center">
                <p className="text-[10px] text-muted-foreground">AI View</p>
                <Switch 
                  checked={showAiImage}
                  onCheckedChange={setShowAiImage}
                  disabled={!hasAiImage}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{currentModel.description}</p>
            <div className="flex gap-2">
              <Select disabled={isDetecting || isBatchDetecting} onValueChange={setSelectedModel} value={selectedModel}>
                <SelectTrigger className="flex-1 border shadow-none bg-transparent hover:bg-accent overflow-hidden rounded-sm">
                  <div className="flex items-center gap-2">
                    <SelectValue placeholder="Choose model" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parasite_detection_yolov8">
                    <div className="flex items-center gap-2">
                      <MicroscopeIcon className="w-4 h-4 text-destructive" />
                      Parasite Detection
                    </div>
                  </SelectItem>
                  <SelectItem value="anemia_detection_yolov8">
                    <div className="flex items-center gap-2">
                      <MicroscopeIcon className="w-4 h-4 text-orange-500" />
                      Anemia Detection
                    </div>
                  </SelectItem>
                  <SelectItem value="malaria_detection_yolov8">
                    <div className="flex items-center gap-2">
                      <MicroscopeIcon className="w-4 h-4 text-secondary" />
                      Malaria Detection
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    disabled={isDetecting || isBatchDetecting}
                    className="px-2.5 bg-linear-to-br bg-ai-bg-start to-ai-bg-end transition-all duration-200 hover:shadow-lg hover:scale-[1.02] text-ai-foreground border-ai-border"
                    onMouseEnter={(e) => {
                      if (!isDetecting && !isBatchDetecting) {
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(147, 51, 234, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    {isDetecting || isBatchDetecting ? (
                      <Loader2 className="w-4 h-4 text-ai-icon animate-spin" />
                    ) : (
                      <Sparkles className="size-4 text-ai-icon" />
                    )} Analyze
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={handleDetect}
                    disabled={isDetecting || isBatchDetecting}
                  >
                    <ImageIcon className="w-4 h-4" />
                    This Image
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleBatchDetect}
                    disabled={isDetecting || isBatchDetecting}
                  >
                    <Images className="w-4 h-4" />
                    All Images
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Edit Drawer */}
        {canEdit && (
          <SampleDrawer 
            patients={sample.patient ? [sample.patient] : []} 
            sample={sample} 
            patient={sample.patient}
            open={isEditDrawerOpen}
            onOpenChange={setIsEditDrawerOpen}
            existingSampleImages={sampleImages}
          >
            <div style={{ display: 'none' }} />
          </SampleDrawer>
        )}

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
