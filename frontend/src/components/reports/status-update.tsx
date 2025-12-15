import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { ALL_STATUSES, getStatusConfig, type ReportStatus } from "@/lib/status-config";
import { useState } from "react";
import toast from "react-hot-toast";
import StatusBadge from "./status-badge";

interface StatusUpdateProps {
  reportId: string;
  currentStatus: ReportStatus;
  disabled?: boolean;
  onUpdate?: (newStatus: ReportStatus) => Promise<void>; // Optional
}

export default function StatusUpdate({ reportId, currentStatus, disabled, onUpdate }: StatusUpdateProps) {
  const [status, setStatus] = useState<ReportStatus>(currentStatus);

  const handleStatusChange = async (newStatus: ReportStatus) => {
    setStatus(newStatus);
    const loadingToast = toast.loading("Updating status...");
    
    try {
      await fetch(`/api/reports/${reportId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      toast.success("Status updated successfully", { id: loadingToast });
      if (onUpdate) await onUpdate(newStatus); // Optional: notify parent
    } catch (e) {
      toast.error("Failed to update status", { id: loadingToast });
      setStatus(currentStatus); // revert on error
    }
  };

  const currentConfig = getStatusConfig(status)

  return (
    <Select 
      value={status} 
      onValueChange={handleStatusChange} 
      disabled={disabled}
    >
      <SelectTrigger 
        className={`px-1.5 rounded-lg`}
        onClick={e => e.stopPropagation()} // Prevent row click propagation
      >
        <StatusBadge status={status}/>
      </SelectTrigger>
      <SelectContent>
        {ALL_STATUSES.map((statusValue) => {
          return (
            <SelectItem key={statusValue} value={statusValue}>
              <StatusBadge status={statusValue}/>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
} 