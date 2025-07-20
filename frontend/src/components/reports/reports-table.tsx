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
import StatusUpdate from "./status-update";
import UserButton from "../users/user-button";
import { CirclePlus } from "lucide-react";

const ReportsTable = ({ reports, initialSearch }: { reports: Report[], initialSearch?: string }) => {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
        
      </div>
      <DataTable
        data={reports}
        initialSearch={initialSearch}
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
          { key: "id", header: "Report ID",customRender: (value: string) => String(value).slice(0, 8).toUpperCase() },
          { key: "title", maxWidth: 250 },
          { key: "patientName", header:"Patient", maxWidth: 180, customRender: (_value, row) => {
            // Parse first and last name from patientName
            const [firstName = "", ...rest] = (row.patientName || "").split(" ");
            const lastName = rest.join(" ");
            return (
              <UserButton
                imageUrl={row.patientImage || ""}
                firstName={firstName}
                lastName={lastName}
                roleName={undefined} // Patient role is not available
                onClick={e => {
                  e.stopPropagation();
                  if (row.patientId) router.push(`/patients/${row.patientId}`);
                }}
              />
            );
          } },
          { key: "testType", maxWidth: 140 },
          { key: "createdAt", header: "Date Created", enableSorting: true, customRender: (value: string) => value ? format(new Date(value), "MMMM d, yyyy") : "" },
          {
            key: "generatedByName", header:"Medical Professional",
            customRender: (_value, row) => {
              // Parse first and last name from generatedByName
              const [firstName = "", ...rest] = (row.generatedByName || "").split(" ");
              const lastName = rest.join(" ");
              return (
                <UserButton
                  imageUrl={row.generatedByImage || ""}
                  firstName={firstName}
                  lastName={lastName}
                  roleName={row.generatedByRole}
                  onClick={e => {
                    console.log('UserButton clicked for doctor');
                    console.log('generatedById:', row.generatedById);
                    e.stopPropagation();
                    router.push(`/users/${row.generatedById}`);
                  }}
                />
              );
            },
            maxWidth: 200,
          },
          {
            key: "status",
            customRender: (_value, row) => (
              <StatusUpdate
                reportId={row.id}
                currentStatus={row.status}
                onUpdate={async () => { router.refresh(); }}
              />
            ),
          },
        ]}
        actionItems={actionItems}
        onRowClick={(report: any) => {
          router.push(`/reports/${report.id}`);
        }}
        customHeaderContent={
          <Button onClick={() => router.push("/reports/create")}>
            <CirclePlus/>
            Create Report
          </Button>
        }
        selectedRowIds={selectedIds}
        onSelectedRowIdsChange={setSelectedIds}
        onBulkDelete={() => setBatchDeleteOpen(true)}
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
      <CustomAlertDialog
        open={batchDeleteOpen}
        onOpenChange={setBatchDeleteOpen}
        title="Are you absolutely sure?"
        description={
          <>
            This action cannot be undone. This will permanently delete {selectedIds.length} reports and remove all their data from our system.
          </>
        }
        onConfirm={async () => {
          const failed: { id: string, error: string }[] = [];
          for (const id of selectedIds) {
            const res = await deleteReport(id);
            if (!res.success) {
              failed.push({ id, error: res.error || 'Unknown error' });
            }
          }
          if (failed.length > 0) {
            toast.error(
              failed.map(f => `ID: ${f.id} - ${f.error}`).join('\n')
            );
          } else {
            toast.success("Selected reports deleted.");
          }
          setSelectedIds([]);
          setBatchDeleteOpen(false);
          router.refresh();
        }}
        confirmText="Continue"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ReportsTable;