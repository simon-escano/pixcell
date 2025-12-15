"use client";
import { deleteReport } from "@/actions/reports";
import { Report } from "@/db/schema";
import { format } from "date-fns";
import { Plus, SlidersHorizontal, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CustomAlertDialog } from "../custom-alert-dialog";
import UserButton from "../members/user-button";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import StatusBadge from "./status-badge";
import { ReportStatus } from "@/lib/status-config";
import SelectionBar from "../selection-bar";

interface ExtendedReport {
  id: string;
  title?: string | null;
  testType?: string | null;
  createdAt: Date | null;
  patientName?: string | null;
  patientId?: string | null;
  patientImage?: string | null;
  generatedByName?: string | null;
  generatedByImage?: string | null;
  generatedByRole?: string | null;
  generatedById?: string | null;
  status?: string | null;
  isAiGenerated?: boolean | null;
}

interface ReportsListProps {
  reports: ExtendedReport[];
  organizationId: string;
  isAdmin?: boolean;
}

type SortOption = "date-desc" | "date-asc" | "title-asc" | "title-desc";

const ReportsList = ({ reports, organizationId, isAdmin = false }: ReportsListProps) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ExtendedReport | null>(null);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [visibleFields, setVisibleFields] = useState({
    status: true,
    title: true,
    patient: true,
    aiGenerated: true,
    type: true,
    member: true,
    date: true,
  });

  // AI Generated badge component
  const AiGeneratedBadge = () => (
    <Badge
      variant="outline"
      className="bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border-purple-200 dark:from-purple-950 dark:to-blue-950 dark:text-purple-300 dark:border-purple-800 border flex items-center font-medium shadow-sm"
    >
      <Sparkles className="size-4 text-purple-600 dark:text-purple-400" />
      AI Generated
    </Badge>
  );

  // Filter and sort reports
  const filteredAndSortedReports = useMemo(() => {
    let filtered = reports.filter((report) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        report.title?.toLowerCase().includes(searchLower) ||
        report.patientName?.toLowerCase().includes(searchLower) ||
        report.testType?.toLowerCase().includes(searchLower) ||
        report.generatedByName?.toLowerCase().includes(searchLower) ||
        report.status?.toLowerCase().includes(searchLower) ||
        report.id?.toLowerCase().includes(searchLower)
      );
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "date-asc":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "title-asc":
          return (a.title || "").localeCompare(b.title || "");
        case "title-desc":
          return (b.title || "").localeCompare(a.title || "");
        default:
          return 0;
      }
    });

    return filtered;
  }, [reports, searchQuery, sortBy]);

  const handleRowClick = (
    e: React.MouseEvent,
    reportId: string,
    index: number
  ) => {
    const isShift = e.shiftKey;
    const isCtrl = e.ctrlKey || e.metaKey; // metaKey for Cmd on Mac

    if (isShift && lastSelectedIndex !== null) {
      // Range selection: select from lastSelectedIndex to current index
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeIds = filteredAndSortedReports
        .slice(start, end + 1)
        .map((r) => r.id);
      
      // Merge with existing selection if Ctrl is also pressed, otherwise replace
      if (isCtrl) {
        setSelectedIds((prev) => {
          const newIds = new Set([...prev, ...rangeIds]);
          return Array.from(newIds);
        });
      } else {
        setSelectedIds(rangeIds);
      }
      setLastSelectedIndex(index);
    } else if (isCtrl) {
      // Toggle individual selection
      setSelectedIds((prev) => {
        if (prev.includes(reportId)) {
          return prev.filter((id) => id !== reportId);
        } else {
          return [...prev, reportId];
        }
      });
      setLastSelectedIndex(index);
    } else {
      // Regular click: navigate to report (unless clicking on checkbox/interactive element)
      const target = e.target as HTMLElement;
      const isInteractive = 
        target.closest('button') ||
        target.closest('[role="button"]') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('[data-prevent-navigation]');
      
      if (!isInteractive) {
        router.push(`/organizations/${organizationId}/reports/${reportId}`);
      }
    }
  };

  const handleCheckboxClick = (
    e: React.MouseEvent,
    reportId: string,
    index: number
  ) => {
    e.stopPropagation();
    
    const isShift = e.shiftKey;
    const isCtrl = e.ctrlKey || e.metaKey;

    if (isShift && lastSelectedIndex !== null) {
      // Range selection
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeIds = filteredAndSortedReports
        .slice(start, end + 1)
        .map((r) => r.id);
      
      if (isCtrl) {
        setSelectedIds((prev) => {
          const newIds = new Set([...prev, ...rangeIds]);
          return Array.from(newIds);
        });
      } else {
        setSelectedIds(rangeIds);
      }
      setLastSelectedIndex(index);
    } else if (isCtrl) {
      // Toggle individual selection
      setSelectedIds((prev) => {
        if (prev.includes(reportId)) {
          return prev.filter((id) => id !== reportId);
        } else {
          return [...prev, reportId];
        }
      });
      setLastSelectedIndex(index);
    } else {
      // Regular checkbox toggle
      setSelectedIds((prev) => {
        if (prev.includes(reportId)) {
          return prev.filter((id) => id !== reportId);
        } else {
          return [...prev, reportId];
        }
      });
      setLastSelectedIndex(index);
    }
  };

  const handleDelete = (report: ExtendedReport) => {
    setSelectedReport(report);
    setDeleteOpen(true);
  };

  const handleBulkDelete = async () => {
    const failed: { id: string; error: string }[] = [];
    for (const id of selectedIds) {
      const res = await deleteReport(id);
      if (!res.success) {
        failed.push({ id, error: res.error || "Unknown error" });
      }
    }
    if (failed.length > 0) {
      toast.error(failed.map((f) => `ID: ${f.id} - ${f.error}`).join("\n"));
    } else {
      toast.success("Selected reports deleted.");
    }
    setSelectedIds([]);
    setBatchDeleteOpen(false);
    router.refresh();
  };

  const parseName = (fullName?: string | null) => {
    if (!fullName) return { firstName: "", lastName: "" };
    const [firstName = "", ...rest] = fullName.split(" ");
    return { firstName, lastName: rest.join(" ") };
  };

  return (
    <>
      <div>
        {/* Header with search, filter, and create button */}
      <div className="flex gap-2 justify-between px-6 py-2 border-b items-center">
        <div className="flex-1 flex gap-2 items-center">
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <SlidersHorizontal className="size-4" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSortBy("date-desc")}>
                Date (Newest)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("date-asc")}>
                Date (Oldest)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("title-asc")}>
                Title (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("title-desc")}>
                Title (Z-A)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Show/Hide Fields</DropdownMenuLabel>
              <div className="p-2">
                <ToggleGroup
                  type="multiple"
                  value={Object.entries(visibleFields)
                    .filter(([_, visible]) => visible)
                    .map(([key]) => key)}
                  onValueChange={(values) => {
                    setVisibleFields({
                      status: values.includes("status"),
                      title: values.includes("title"),
                      patient: values.includes("patient"),
                      aiGenerated: values.includes("aiGenerated"),
                      type: values.includes("type"),
                      member: values.includes("member"),
                      date: values.includes("date"),
                    });
                  }}
                  className="flex flex-wrap gap-1"
                >
                  <ToggleGroupItem value="status" aria-label="Toggle status" size="sm">
                    Status
                  </ToggleGroupItem>
                  <ToggleGroupItem value="title" aria-label="Toggle title" size="sm">
                    Title
                  </ToggleGroupItem>
                  <ToggleGroupItem value="patient" aria-label="Toggle patient" size="sm">
                    Patient
                  </ToggleGroupItem>
                  <ToggleGroupItem value="aiGenerated" aria-label="Toggle AI Generated" size="sm">
                    AI Generated
                  </ToggleGroupItem>
                  <ToggleGroupItem value="type" aria-label="Toggle type" size="sm">
                    Type
                  </ToggleGroupItem>
                  <ToggleGroupItem value="member" aria-label="Toggle member" size="sm">
                    Member
                  </ToggleGroupItem>
                  <ToggleGroupItem value="date" aria-label="Toggle date" size="sm">
                    Date
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => router.push(`/organizations/${organizationId}/reports/create`)}>
            <Plus />
            Create Report
          </Button>
        </div>
      </div>

      {/* Reports List */}
      <div>
        {filteredAndSortedReports.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No reports found
          </div>
        ) : (
          filteredAndSortedReports.map((report, index) => {
            const patientName = parseName(report.patientName);
            const memberName = parseName(report.generatedByName);
            const date = report.createdAt
              ? format(new Date(report.createdAt), "MMM d")
              : null;

            return (
              <div
                key={report.id}
                className={`group flex items-center gap-3 pr-6 h-[50px] hover:bg-accent/50 cursor-pointer transition-colors justify-between ${!isAdmin ? 'pl-6' : ''}`}
                onClick={(e) => handleRowClick(e, report.id, index)}
              >
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <div className="px-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                      <Checkbox
                        checked={selectedIds.includes(report.id)}
                        onClick={(e) => handleCheckboxClick(e, report.id, index)}
                      />
                    </div>
                  )}
                  {visibleFields.status && report.status && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <StatusBadge status={report.status as ReportStatus} />
                    </div>
                  )}
                  {visibleFields.title && (
                    <span className="font-medium text-sm min-w-0 max-w-full truncate">
                      {report.title || "Untitled Report"}
                    </span>
                  )}
                  {visibleFields.patient && report.patientId && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <p className="text-sm  text-muted-foreground">for</p>
                        <UserButton
                          imageUrl={report.patientImage || ""}
                          firstName={patientName.firstName}
                          lastName={patientName.lastName}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (report.patientId) {
                              router.push(`/organizations/${organizationId}/patients/${report.patientId}`);
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {visibleFields.aiGenerated && report.isAiGenerated && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <AiGeneratedBadge />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {visibleFields.type && report.testType && (
                    <Badge
                      variant="outline"
                      className="border-dashed flex justify-start rounded-sm flex-shrink-0 px-1.5 py-0.5 text-[10px] max-w-full"
                    >
                      <p className="truncate">
                        <span className="text-muted-foreground mr-1.5">Type</span>
                        {report.testType}
                      </p>
                    </Badge>
                  )}
                  {visibleFields.member && report.generatedById && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <UserButton
                        imageUrl={report.generatedByImage || ""}
                        firstName={memberName.firstName}
                        lastName={memberName.lastName}
                        roleName={report.generatedByRole || undefined}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (report.generatedById) {
                            router.push(`/organizations/${organizationId}/members/${report.generatedById}`);
                          }
                        }}
                      />
                    </div>
                  )}
                  {visibleFields.date && date !== null && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {date}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      </div>

      {/* Delete Dialogs */}
      <CustomAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Are you absolutely sure?"
        description={
          selectedReport?.title ? (
            <>
              This action cannot be undone. This will permanently delete report{" "}
              <span className="text-primary font-semibold">{selectedReport.title}</span>.
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
            This action cannot be undone. This will permanently delete {selectedIds.length} reports
            and remove all their data from our system.
          </>
        }
        onConfirm={handleBulkDelete}
        confirmText="Continue"
        cancelText="Cancel"
      />
      {/* Selection Bar - positioned relative to parent container */}
      <SelectionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onDelete={() => setBatchDeleteOpen(true)}
        deleteLabel="Delete"
      />
    </>
  );
};

export default ReportsList;

