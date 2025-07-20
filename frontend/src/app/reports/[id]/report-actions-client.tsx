"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import QRCode from "react-qr-code";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { deleteReport } from "@/actions/reports";
import { FileText, Edit, Trash2, QrCode, Copy, Download } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import React from "react";

export default function ReportActions({
  reportId,
  formData,
  reportStatus,
  reportCode,
}: {
  reportId: string;
  formData: any;
  reportStatus: string;
  reportCode: string
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [qrSvg, setQrSvg] = useState<SVGSVGElement | null>(null);
  // The URL to view the report (for QR code)
  const reportUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/reports/view/${reportCode}`;
  const qrContainerId = `qr-container-${reportId}`;

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

  const handleCopyQr = async () => {
    await navigator.clipboard.writeText(reportUrl);
    toast.success("QR code link copied!");
  };

  const handleDownloadQr = () => {
    const el = document.getElementById(qrContainerId);
    if (!el) return;
    const svg = el.querySelector("svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const svg64 = btoa(unescape(encodeURIComponent(source)));
    const image64 = `data:image/svg+xml;base64,${svg64}`;
    const link = document.createElement("a");
    link.href = image64;
    link.download = "qr-code.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {reportStatus === "Finalized" && (
        <div className="flex flex-col items-center gap-2">
          <div className="bg-white p-2 rounded shadow" id={qrContainerId}>
            <QRCode
              value={reportUrl}
              size={96}
            />
            
          </div>
          <span>Code: {reportCode}</span>
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" onClick={handleCopyQr} className="flex items-center gap-1">
              <Copy className="h-4 w-4" /> Copy
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadQr} className="flex items-center gap-1">
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
          <span className="text-xs text-gray-500">Scan to view report</span>

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