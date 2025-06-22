import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Microscope,
  TrendingUp
} from "lucide-react";

interface DetectionResult {
  detections: any[];
  total_detections: number;
  success: boolean;
}

interface AiAnalysis {
  success: boolean;
  findings: any;
  [key: string]: any;
}

interface AnalysisResultsProps {
  detectionResults: DetectionResult | null;
  aiAnalysis: AiAnalysis | null;
}

export function AnalysisResults({ detectionResults, aiAnalysis }: AnalysisResultsProps) {
  if (!detectionResults && !aiAnalysis) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Detection Results */}
      {detectionResults && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Microscope className="h-5 w-5" />
              Detection Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={detectionResults.total_detections > 0 ? "destructive" : "secondary"}>
                {detectionResults.total_detections} Detection{detectionResults.total_detections !== 1 ? 's' : ''}
              </Badge>
              {detectionResults.success && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
            
            {detectionResults.detections && detectionResults.detections.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Detected Objects:</h4>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {detectionResults.detections.map((detection, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2">
                          <Activity className="h-3 w-3 text-red-500" />
                          <span className="text-sm font-medium">
                            {detection.class || `Object ${index + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {Math.round((detection.confidence || 0) * 100)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Analysis */}
      {aiAnalysis && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={aiAnalysis.success ? "default" : "secondary"}>
                Analysis Complete
              </Badge>
              {aiAnalysis.success && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>

            {aiAnalysis.findings && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Findings:</h4>
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {Object.entries(aiAnalysis.findings).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Info className="h-3 w-3 text-blue-500" />
                          <span className="text-sm font-medium capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="ml-5">
                          {typeof value === 'object' ? (
                            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {String(value)}
                            </p>
                          )}
                        </div>
                        <Separator />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Display other AI analysis properties */}
            {Object.entries(aiAnalysis).filter(([key]) => key !== 'success' && key !== 'findings').map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  <span className="text-sm font-medium capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="ml-5">
                  {typeof value === 'object' ? (
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {String(value)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 