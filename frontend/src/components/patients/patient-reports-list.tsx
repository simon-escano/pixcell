"use client";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export function PatientReportsList({ reports }: { reports: any[] }) {
  return (
    <div className="space-y-2 h-full overflow-auto">
      {reports.map((report, index) => (
        <div
          key={report.id}
          className="group flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all duration-200 border border-transparent hover:border-slate-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-slate-400 rounded-full"></div>
            <div>
              <div className="font-medium text-slate-900 text-sm">
                {report.title || `Report #${String(index + 1).padStart(3, "0")}`}
              </div>
              {report.createdAt && (
                <div className="text-xs text-slate-500 mt-0.5">
                  {new Date(report.createdAt).toLocaleDateString("en-US", {
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
              <div className="text-xs font-medium text-slate-900">{report.status || "Ready"}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
              onClick={() => window.location.href = `/reports/${report.id}`}
            >
              <FileText className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
} 