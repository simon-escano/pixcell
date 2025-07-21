'use client';
import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FileText, TestTube } from "lucide-react";

export interface ProfilePageLayoutProps {
  entity: any; // user or patient
  samples: any[];
  reports: any[];
  metaEntity?: any;
  editDialogTrigger: ReactNode;
  details: ReactNode; // extra details (fields)
  actions?: ReactNode; // action buttons (optional)
  sampleList?: ReactNode; // custom sample list (optional)
  reportList: ReactNode; // report list (required)
  reportCount?: number; // for patients
  patientsList?: ReactNode; // for users with patients
  patientsCount?: number; // for users with patients
}

export default function ProfilePageLayout({
  entity,
  samples,
  reports,
  metaEntity,
  editDialogTrigger,
  details,
  actions,
  sampleList,
  reportList,
  reportCount,
  patientsList,
  patientsCount,
}: ProfilePageLayoutProps) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-3rem)]">
          {/* Info Panel */}
          <div className="col-span-4">
            <Card className="h-full shadow-sm border-0 bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-[var(--ring)]">
                    <AvatarImage
                      src={entity.imageUrl || ""}
                      alt={`${entity.firstName} ${entity.lastName}`}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-base font-medium">
                      {entity.firstName[0]}
                      {entity.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                      {entity.firstName} {entity.lastName}
                    </h1>
                    {entity.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{entity.email}</p>
                    )}
                  </div>
                  {editDialogTrigger}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted rounded-lg p-2 text-center">
                    <div className="text-base font-semibold text-card-foreground">{samples.length}</div>
                    <div className="text-xs text-muted-foreground">Samples</div>
                  </div>
                  <div className="bg-muted rounded-lg p-2 text-center">
                    <div className="text-base font-semibold text-card-foreground">{reportCount ?? reports.length}</div>
                    <div className="text-xs text-muted-foreground">Reports</div>
                  </div>
                </div>
                <Separator />
                {/* Details */}
                {details}
                <Separator />
                {/* Actions */}
                {actions}
              </CardContent>
            </Card>
          </div>
          {/* Samples & Reports Panel */}
          <div className="col-span-8">
            <Card className="h-full shadow-sm border-0 bg-card">
              <Tabs defaultValue="samples" className="h-full flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-border">
                  <TabsList className="bg-muted p-1">
                    <TabsTrigger
                      value="samples"
                      className="data-[state=active]:bg-card data-[state=active]:shadow-sm px-3 py-1.5 text-sm"
                    >
                      Samples ({samples.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="reports"
                      className="data-[state=active]:bg-card data-[state=active]:shadow-sm px-3 py-1.5 text-sm"
                    >
                      Reports ({reportCount ?? reports.length})
                    </TabsTrigger>
                    {patientsList && (
                      <TabsTrigger
                        value="patients"
                        className="data-[state=active]:bg-card data-[state=active]:shadow-sm px-3 py-1.5 text-sm"
                      >
                        Patients{typeof patientsCount === 'number' ? ` (${patientsCount})` : ''}
                      </TabsTrigger>
                    )}
                  </TabsList>
                </div>
                {/* Content */}
                <div className="flex-1 overflow-hidden">
                  <TabsContent value="samples" className="h-full m-0 p-4">
                    {sampleList ?? (
                      samples.length > 0 ? (
                        <div className="space-y-2 h-full overflow-auto">
                          {samples.map((sample, index) => (
                            <button
                              key={`${sample.id}-${index}`}
                              className="group flex items-center justify-between p-3 bg-muted hover:bg-muted/80 rounded-lg transition-all duration-200 border border-transparent hover:border-border w-full text-left"
                              onClick={() => router.push(`/samples/${sample.id}`)}
                              type="button"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-1 h-8 bg-primary rounded-full"></div>
                                <div>
                                  <div className="font-medium text-card-foreground text-sm">
                                    {sample.sampleName || `Sample #${String(index + 1).padStart(3, "0")}`}
                                  </div>
                                  {sample.capturedAt && (
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                      {new Date(sample.capturedAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                             
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3">
                            <TestTube className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="text-base font-medium text-card-foreground mb-2">No samples yet</h3>
                          <p className="text-muted-foreground mb-4 max-w-sm leading-relaxed text-sm">
                            Upload the first sample to begin analysis and generate reports.
                          </p>
                        </div>
                      )
                    )}
                  </TabsContent>
                  <TabsContent value="reports" className="h-full m-0 p-4">
                    {reportList}
                  </TabsContent>
                  {patientsList && (
                    <TabsContent value="patients" className="h-full m-0 p-4">
                      {patientsList}
                    </TabsContent>
                  )}
                </div>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 