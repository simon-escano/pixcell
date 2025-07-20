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

const STATUS_COLORS: Record<ReportStatus, string> = {
  Draft: "bg-gray-200 text-gray-800",
  Finalized: "bg-green-200 text-green-800",
  UNDER_REVIEW: "bg-yellow-200 text-yellow-800",
  REJECTED: "bg-red-200 text-red-800",
  ARCHIVED: "bg-gray-300 text-gray-500",
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  Draft: "Draft",
  Finalized: "Finalized",
  UNDER_REVIEW: "Under Review",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

export default function StatusUpdate({ reportId, currentStatus, disabled, onUpdate }: StatusUpdateProps) {
  const [status, setStatus] = useState<ReportStatus>(currentStatus);
  const [isPending, setIsPending] = useState(false);

  const handleStatusChange = async (newStatus: ReportStatus) => {
    setStatus(newStatus);
    setIsPending(true);
    try {
      await fetch(`/api/reports/${reportId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (onUpdate) await onUpdate(newStatus); // Optional: notify parent
    } catch (e) {
      // Handle error (show toast, etc.)
      setStatus(currentStatus); // revert on error
    }
    setIsPending(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select 
          value={status} 
          onValueChange={handleStatusChange} 
          disabled={disabled || isPending}
        >
          <SelectTrigger 
            className="w-40"
            onClick={e => e.stopPropagation()} // Prevent row click propagation
          >
            <div className={`flex items-center gap-2 px-2 py-1 rounded ${STATUS_COLORS[status]}`}
                 style={{ minHeight: 28 }}>
              <span className="block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: STATUS_COLORS[status].split(' ')[0].replace('bg-', '').replace('-200', '') }} />
              <span>{STATUS_LABELS[status]}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                <div className={`flex items-center gap-2 px-2 py-1 rounded ${STATUS_COLORS[value as ReportStatus]}`}
                     style={{ minHeight: 28 }}>
                  <span className="block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: STATUS_COLORS[value as ReportStatus].split(' ')[0].replace('bg-', '').replace('-200', '') }} />
                  <span>{label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isPending && <span className="text-xs text-muted-foreground ml-2">Updating...</span>}
      </div>
    </div>
  );
} 