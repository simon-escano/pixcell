"use client";

import { CustomAlertDialog } from "@/components/custom-alert-dialog";
import { AlertCircle } from "lucide-react";

export default function AiGeneratedNoticeClient() {
  return (
    <CustomAlertDialog
      title={
        <span className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          AI Generated Report
        </span>
      }
      description={
        "This report was generated using AI assistance. Please review all content carefully before finalizing."
      }
      onConfirm={async () => {}}
      confirmText="OK"
      cancelText=""
    />
  );
} 