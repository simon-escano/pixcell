import Base from "@/components/base"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPatientById, getReportCountByPatientId, getSamplesByPatientId } from "@/db/queries/select"
import { Mail, Edit, FileText, TestTube } from "lucide-react"
import { PatientActionRow } from "@/components/patients/patient-action-row"

export default async function PatientPage({
  params,
}: {
  params: Promise<{ patientId: string }>
}) {
  const patientId = (await params).patientId
  const patientData = await getPatientById(patientId)
  const samples = await getSamplesByPatientId(patientId)
  const reportCount = await getReportCountByPatientId(patientId)

  return (
    <Base>
      <div className="flex h-screen bg-gray-50">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Patients</span>
                <span>/</span>
                <span className="text-gray-900 font-medium">
                  {patientData.firstName} {patientData.lastName}
                </span>
              </div>
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                <Edit className="size-4" />
                Edit patient
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-12 gap-6 p-6 h-full">
              {/* Left Column - Patient Info */}
              <div className="col-span-4 space-y-6">
                {/* Patient Profile Card */}
                <Card className="bg-gray-100">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center mb-6">
                      <Avatar className="size-20 mb-4">
                        <AvatarImage
                          src={patientData.imageUrl || ""}
                          alt={`${patientData.firstName} ${patientData.lastName}`}
                        />
                        <AvatarFallback className="text-xl">
                          {patientData.firstName[0]}
                          {patientData.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {patientData.firstName} {patientData.lastName}
                      </h2>
                      <p className="text-gray-600 text-sm">{patientData.email}</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{samples.length}</div>
                        <div className="text-sm text-gray-600">Samples</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{reportCount}</div>
                        <div className="text-sm text-gray-600">Reports</div>
                      </div>
                    </div>

                    <PatientActionRow
                      patientId={patientId}
                      patientName={`${patientData.firstName} ${patientData.lastName}`}
                    />
                  </CardContent>
                </Card>

                {/* Patient Details */}
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600 mb-1">Gender</div>
                        <div className="font-medium">Male</div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Birthday</div>
                        <div className="font-medium">
                          {new Date(patientData.birthDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Phone number</div>
                        <div className="font-medium">{patientData.contactNumber}</div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Address</div>
                        <div className="font-medium">{patientData.address}</div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Height</div>
                        <div className="font-medium">{patientData.height} cm</div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Weight</div>
                        <div className="font-medium">{patientData.weight} kg</div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Blood Type</div>
                        <div className="font-medium">{patientData.bloodType}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Middle Column - Samples */}
              <div className="col-span-5">
                <Card className="h-full">
                  <CardHeader className="pb-4">
                    <Tabs defaultValue="samples" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="samples">Samples</TabsTrigger>
                        <TabsTrigger value="reports">Reports</TabsTrigger>
                      </TabsList>

                      <TabsContent value="samples" className="mt-4">
                        <div className="space-y-4">
                          {samples.length > 0 ? (
                            samples.map((sample) => (
                              <div
                                key={sample.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                                  <div>
                                    <div className="font-medium text-gray-900">Sample #{sample.id}</div>
                                    <div className="text-sm text-gray-600">
                                      {new Date(sample.createdAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-900">
                                    {sample.type || "Blood Sample"}
                                  </div>
                                  <div className="text-sm text-gray-600">Processing</div>
                                </div>
                                <Button variant="ghost" size="sm">
                                  <FileText className="size-4" />
                                </Button>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <TestTube className="size-8 mx-auto mb-2 text-gray-400" />
                              <p>No samples found</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="reports" className="mt-4">
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="size-8 mx-auto mb-2 text-gray-400" />
                          <p>No reports available</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardHeader>
                </Card>
              </div>

              {/* Right Column - Files & Actions */}
              <div className="col-span-3 space-y-6">
                {/* Files/Documents */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Files / Documents</CardTitle>
                      <Button variant="ghost" size="sm" className="text-blue-600">
                        Add files
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <FileText className="size-4 text-red-500" />
                        <span className="text-sm">Blood tests.pdf</span>
                      </div>
                      <span className="text-xs text-gray-500">27 kb</span>
                    </div>
                    <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <FileText className="size-4 text-blue-500" />
                        <span className="text-sm">Medical prescriptions.pdf</span>
                      </div>
                      <span className="text-xs text-gray-500">9 kb</span>
                    </div>
                    <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <FileText className="size-4 text-green-500" />
                        <span className="text-sm">X-Ray results 2.pdf</span>
                      </div>
                      <span className="text-xs text-gray-500">27 kb</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                      <TestTube className="size-4 mr-2" />
                      Add Sample
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                      <FileText className="size-4 mr-2" />
                      Generate Report
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                      <Mail className="size-4 mr-2" />
                      Send Message
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Base>
  )
}
