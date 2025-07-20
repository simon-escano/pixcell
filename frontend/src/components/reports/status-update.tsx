import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

export type ReportStatus = "Draft" | "Finalized" | "UNDER_REVIEW" | "REJECTED" | "ARCHIVED";

interface StatusUpdateProps {
  reportId: string;
  currentStatus: ReportStatus;
  disabled?: boolean;
  onUpdate?: (newStatus: ReportStatus) => Promise<void>; // Optional
}

export default function StatusUpdate({ reportId, currentStatus, disabled, onUpdate }: StatusUpdateProps) {
  const [status, setStatus] = useState<ReportStatus>(currentStatus);
  const [isPending, setIsPending] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleStatusChange = (newStatus: ReportStatus) => {
    setStatus(newStatus);
    setShowActions(newStatus !== currentStatus);
  };

  const handleUpdateStatus = async () => {
    setIsPending(true);
    try {
      await fetch(`/api/reports/${reportId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (onUpdate) await onUpdate(status); // Optional: notify parent
      setShowActions(false);
    } catch (e) {
      // Handle error (show toast, etc.)
    }
    setIsPending(false);
  };

  const handleCancel = () => {
    setStatus(currentStatus);
    setShowActions(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select value={status} onValueChange={handleStatusChange} disabled={disabled || isPending}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Finalized">Finalized</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {showActions && (
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={handleUpdateStatus} disabled={isPending}>
            {isPending ? "Updating..." : "Update Status"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} disabled={isPending}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
} 