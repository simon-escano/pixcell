import Base from "@/components/base";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllReports, getReportsByGeneratedBy } from "@/db/queries/select";
import { getUser } from "@/lib/auth";
import { format } from "date-fns";
import { FileText, User } from "lucide-react";
import Link from "next/link";
import { getProfileByUserId, getRoleById } from "@/db/queries/select";

export default async function ReportsPage() {
  const user = await getUser();
  const profile = await getProfileByUserId(user.id);
  const role = await getRoleById(profile.roleId);
  
  // If user is admin, show all reports, otherwise show only user's reports
  const reports = role.name === "Administrator"
    ? await getAllReports()
    : await getReportsByGeneratedBy(user.id);

  return (
    <Base>
      <div className="h-full overflow-y-auto p-4 sm:p-8">
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  Report for {report.patientName}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      report.isAiGenerated
                        ? "bg-blue-200 text-blue-800"
                        : "bg-green-200 text-green-800"
                    }`}
                  >
                    {report.isAiGenerated ? "AI Generated" : "Manual"}
                  </span>
                  {report.exportedUrl && (
                    <Link
                      href={report.exportedUrl}
                      target="_blank"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <FileText className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage
                          src={report.patientImage || ""}
                          alt={report.patientName}
                          className="rounded-lg"
                        />
                        <AvatarFallback className="rounded-lg">
                          {report.patientName.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          <Link
                            href={`/patients/${report.patientId}`}
                            className="hover:underline"
                          >
                            {report.patientName}
                          </Link>
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Sample: {report.sampleName || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="text-muted-foreground h-4 w-4" />
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          <Link
                            href={`/users/${report.generatedById}`}
                            className="hover:underline"
                          >
                            {report.generatedByName}
                          </Link>
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {report.generatedByRole}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {report.content}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {format(new Date(report.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Base>
  );
}
