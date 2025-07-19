"use client";
import { Report } from "@/db/schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { DataTable } from "../data-table";
import { CustomAlertDialog } from "../custom-alert-dialog";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { deleteReport } from "@/actions/reports";
import { format } from "date-fns";

const ReportsTable = ({ reports }: { reports: Report[] }) => {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const actionItems = [
    {
      label: "Copy Report ID",
      onClick: (report: Report) => {
        navigator.clipboard.writeText(report.id);
        toast.success("Report ID copied to clipboard");
      },
    },
    {
      label: "View Report",
      onClick: (report: Report) => {
        router.push(`/reports/${report.id}`);
      },
    },
    {
      label: "Delete Report",
      onClick: (report: Report) => {
        setSelectedReport(report);
        setDeleteOpen(true);
      },
      customRender: () => (
        <button className="text-red-500 hover:text-red-700">Delete Report</button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
        <Button onClick={() => router.push("/reports/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Report
        </Button>
      </div>
      <DataTable
        data={reports}
        excludeColumns={[   
          'content',
          'isAiGenerated',
          'exportedUrl',
          'exportFormat',
          'sampleId',
          'sampleName',
          'patientId',
          'patientImage',
          'generatedById',
          'generatedByImage',
          'generatedByRole',]}
        defaultHiddenColumns={[]}
        searchPlaceholder="Search reports..."
        searchableColumns={["id", "title", "patientName", "testType", "status", "generatedByName" , "createdAt"]}
        columnConfigs={[
          { key: "id", customRender: (value: string) => String(value).slice(0, 8).toUpperCase() },
          { key: "title", maxWidth: 250 },
          { key: "patientName", maxWidth: 180 },
          { key: "testType", maxWidth: 140 },
          { key: "createdAt", enableSorting: true, customRender: (value: string) => value ? format(new Date(value), "MMMM d, yyyy") : "" },
          { key: "status" },
        ]}
        actionItems={actionItems}
        onRowClick={(report: any) => {
          router.push(`/reports/${report.id}`);
        }}
      />
      <CustomAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Are you absolutely sure?"
        description={
          typeof selectedReport?.content === 'string' ? (
            <>
              This action cannot be undone. This will permanently delete report {" "}
              <span className="text-primary font-semibold">{selectedReport.content}</span>.
            </>
          ) : (
            "This action cannot be undone. This will permanently delete the selected report."
          )
        }
        onConfirm={async () => {
          if (!selectedReport) return;
          const res = await deleteReport(selectedReport.id);
          if (res.success) {
            toast.success("Report deleted");
            setDeleteOpen(false);
            router.refresh();
          } else {
            toast.error(res.error || "Failed to delete report.");
          }
        }}
        confirmText="Continue"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ReportsTable;