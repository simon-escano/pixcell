"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import QRCode from "react-qr-code";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { deleteReport } from "@/actions/reports";
import { FileText, Edit, Trash2, QrCode } from "lucide-react";
import { PDFExport } from "@/components/reports/pdf-export";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";

export default function ReportActions({
  reportId,
  formData,
  reportStatus,
  pdfExportProps,
}: {
  reportId: string;
  formData: any;
  reportStatus: string;
  pdfExportProps: any;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleEdit = () => {
    router.push(`/reports/${reportId}/edit`);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    setShowDeleteDialog(false);
    startTransition(async () => {
      const res = await deleteReport(reportId);
      if (res.success) {
        router.push("/reports");
        router.refresh();
        toast.success("Report deleted successfully");
        
      } else {
        toast.error(res.error || "Failed to delete report");
      }
    });
  };

  // The URL to view the PDF (for QR code)
  const pdfUrl = `/reports/${reportId}?pdf=1`;

  return (
    <div className="space-y-4">
      {reportStatus === "Finalized" && (
        <div className="flex flex-col items-center gap-2">
          <div className="bg-white p-2 rounded shadow">
            <QRCode value={typeof window !== "undefined" ? window.location.origin + pdfUrl : pdfUrl} size={96} />
          </div> 
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleEdit}
        className="flex items-center gap-2 w-full"
      >
        <Edit className="h-4 w-4" />
        Edit Report
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={isPending}
        className="flex items-center gap-2 w-full"
      >
        <Trash2 className="h-4 w-4" />
        Delete Report
      </Button>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report?</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this report? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 