import Base from "@/components/base"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { getPatientById, getReportCountByPatientId, getSamplesByPatientId, getReportsByPatientId } from "@/db/queries/select"
import { FileText, TestTube, Edit } from "lucide-react"
import { UploadSampleDrawerForPatient } from "@/components/samples/upload-sample-drawer"
import { useRouter } from "next/navigation";
import { EditPatientDialogTrigger } from "@/components/patients/edit-patient-dialog-trigger";
import { PatientReportsList } from "@/components/patients/patient-reports-list";

export default async function PatientPage({
  params,
}: {
  params: Promise<{ patientId: string }>
}) {
  const patientId = (await params).patientId
  const patientData = await getPatientById(patientId)
  const samples = await getSamplesByPatientId(patientId)
  const reportCount = await getReportCountByPatientId(patientId)
  const reports = await getReportsByPatientId(patientId)

  // State for edit dialog (client component)
  // We'll use a client wrapper for the edit dialog trigger and state

  return (
    <Base>
      <div className="min-h-screen bg-slate-50/50">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-3rem)]">
            {/* Patient Information Panel */}
            <div className="col-span-4">
              <Card className="h-full shadow-sm border-0 bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-slate-100">
                      <AvatarImage
                        src={patientData.imageUrl || ""}
                        alt={`${patientData.firstName} ${patientData.lastName}`}
                      />
                      <AvatarFallback className="bg-purple-100 text-purple-700 text-base font-medium">
                        {patientData.firstName[0]}
                        {patientData.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-lg font-semibold text-slate-900 leading-tight">
                        {patientData.firstName} {patientData.lastName}
                      </h1>
                      <p className="text-xs text-slate-600 mt-0.5">{patientData.email}</p>
                    </div>
                    {/* Edit Patient Dialog Trigger (client component) */}
                    <EditPatientDialogTrigger patient={patientData} />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <div className="text-base font-semibold text-slate-900">{samples.length}</div>
                      <div className="text-xs text-slate-600">Samples</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <div className="text-base font-semibold text-slate-900">{reportCount}</div>
                      <div className="text-xs text-slate-600">Reports</div>
                    </div>
                  </div>

                  <Separator />

                  {/* Patient Details - Smaller fonts */}
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      <div>
                        <span className="text-slate-500">Gender</span>
                        <div className="font-medium text-slate-900">{patientData.sex || "Male"}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Birthday</span>
                        <div className="font-medium text-slate-900">
                          {new Date(patientData.birthDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Phone</span>
                        <div className="font-medium text-slate-900">{patientData.contactNumber}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Blood Type</span>
                        <div className="font-medium text-slate-600">{patientData.bloodType}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Height</span>
                        <div className="font-medium text-slate-900">{patientData.height} cm</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Weight</span>
                        <div className="font-medium text-slate-900">{patientData.weight} kg</div>
                      </div>
                    </div>
                    <div className="pt-1.5 border-t border-slate-100">
                      <span className="text-slate-500">Address</span>
                      <div className="font-medium text-slate-900">{patientData.address}</div>
                    </div>
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <UploadSampleDrawerForPatient
                      patientId={patientId}
                      className="bg-purple-600 hover:bg-purple-700 text-white w-full text-sm py-2"
                    />
                    <form action={`/reports`} method="get">
                      <input type="hidden" name="search" value={`${patientData.firstName} ${patientData.lastName}`} />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        className="w-full text-sm py-2 text-slate-600 hover:text-slate-900 bg-transparent"
                      >
                        View Reports
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Samples & Reports Panel */}
            <div className="col-span-8">
              <Card className="h-full shadow-sm border-0 bg-white">
                <Tabs defaultValue="samples" className="h-full flex flex-col">
                  {/* Header - No buttons */}
                  <div className="p-4 border-b border-slate-100">
                    <TabsList className="bg-slate-100 p-1">
                      <TabsTrigger
                        value="samples"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 py-1.5 text-sm"
                      >
                        Samples ({samples.length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="reports"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 py-1.5 text-sm"
                      >
                        Reports ({reportCount})
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-hidden">
                    <TabsContent value="samples" className="h-full m-0 p-4">
                      {samples.length > 0 ? (
                        <div className="space-y-2 h-full overflow-auto">
                          {samples.map((sample, index) => (
                            <div
                              key={sample.id}
                              className="group flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all duration-200 border border-transparent hover:border-slate-200"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-1 h-8 bg-purple-500 rounded-full"></div>
                                <div>
                                  <div className="font-medium text-slate-900 text-sm">
                                    {sample.sampleName || `Sample #${String(index + 1).padStart(3, "0")}`}
                                  </div>
                                  {sample.capturedAt && (
                                    <div className="text-xs text-slate-500 mt-0.5">
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
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <div className="text-xs font-medium text-slate-900">Processing</div>
                                  <div className="text-xs text-slate-500">In progress</div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                                >
                                  <FileText className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                            <TestTube className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-base font-medium text-slate-900 mb-2">No samples yet</h3>
                          <p className="text-slate-600 mb-4 max-w-sm leading-relaxed text-sm">
                            Upload the first sample for this patient to begin analysis and generate reports.
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="reports" className="h-full m-0 p-4">
                      {reports.length > 0 ? (
                        <PatientReportsList reports={reports} />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                            <FileText className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-base font-medium text-slate-900 mb-2">No reports available</h3>
                          <p className="text-slate-600 max-w-sm leading-relaxed text-sm">
                            Reports will be generated automatically once samples are processed and analyzed.
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Base>
  )
}
