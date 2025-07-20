"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  FilterFn,
} from "@tanstack/react-table";
import { ChevronsUpDown, ChevronDown, MoreHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ClientDate from "./client-date";

export type ActionItem = {
  label: string | React.ReactNode;
  onClick: (row: any) => void;
  customRender?: (row: any) => React.ReactNode;
};

export type ColumnConfig = {
  key: string;
  header?: string; // <-- Add this line
  maxWidth?: number;
  enableSorting?: boolean;
  enableSearching?: boolean;
  customRender?: (value: any, row?: any) => React.ReactNode;
};

export type DataTableProps<TData> = {
  data: TData[];
  onRowClick?: (row: TData) => void;
  excludeColumns?: string[];
  columnConfigs?: ColumnConfig[];
  searchPlaceholder?: string;
  maxRowsPerPage?: number;
  actionItems?: ActionItem[];
  actionLabel?: string;
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  enablePagination?: boolean;
  customColumns?: ColumnDef<TData>[];
  customHeaderContent?: React.ReactNode;
  searchableColumns?: string[];
  separateLastAction?: boolean;
  defaultHiddenColumns?: string[];
  // Add for batch selection
  selectedRowIds?: string[];
  onSelectedRowIdsChange?: (ids: string[]) => void;
  getRowId?: (row: TData, index: number, parent?: any) => string;
  bulkActions?: (selectedRowIds: string[], selectedRows: any[]) => React.ReactNode;
  onBulkDelete?: (selectedRowIds: string[], selectedRows: TData[]) => void;
};

export function DataTable<TData extends Record<string, any>>({
  data: initialData,
  onRowClick,
  excludeColumns = [],
  columnConfigs = [],
  searchPlaceholder = "Search...",
  maxRowsPerPage = 10,
  actionItems = [],
  actionLabel = "Actions",
  enableRowSelection = true,
  enableColumnVisibility = true,
  enablePagination = true,
  customColumns,
  customHeaderContent,
  searchableColumns,
  separateLastAction = false,
  defaultHiddenColumns = [],
  selectedRowIds,
  onSelectedRowIdsChange,
  getRowId,
  bulkActions,
  onBulkDelete,
}: DataTableProps<TData>) {
  const [data, setData] = React.useState(() => initialData);
  const [globalFilter, setGlobalFilter] = React.useState(initialSearch);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(() => {
    const initialVisibility: VisibilityState = {};
    defaultHiddenColumns.forEach(column => {
      initialVisibility[column] = false;
    });
    return initialVisibility;
  });
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  // Sync controlled selection from parent
  React.useEffect(() => {
    if (selectedRowIds) {
      const selectionObj: Record<string, boolean> = {};
      selectedRowIds.forEach((id) => {
        selectionObj[id] = true;
      });
      // Only update if different
      const isDifferent =
        Object.keys(selectionObj).length !== Object.keys(rowSelection).length ||
        Object.keys(selectionObj).some((id) => rowSelection[id] !== selectionObj[id]);
      if (isDifferent) {
        setRowSelection(selectionObj);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRowIds]);

  // Notify parent on selection change, only if different
  const prevIdsRef = React.useRef<string[]>([]);
  React.useEffect(() => {
    if (onSelectedRowIdsChange) {
      const ids = Object.keys(rowSelection).filter((id) => rowSelection[id]);
      // Only notify if different
      if (
        ids.length !== prevIdsRef.current.length ||
        ids.some((id, i) => id !== prevIdsRef.current[i])
      ) {
        prevIdsRef.current = ids;
        onSelectedRowIdsChange(ids);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection]);

  // Convert columnConfigs array to a map for easier access
  const columnConfigMap = React.useMemo(() => {
    const map: Record<string, ColumnConfig> = {};
    columnConfigs.forEach((config) => {
      map[config.key] = config;
    });
    return map;
  }, [columnConfigs]);

  // Custom filter function that only searches in specified columns
  const customGlobalFilterFn: FilterFn<any> = React.useCallback(
    (row, columnId, filterValue) => {
      // If no searchableColumns specified, search all columns
      if (!searchableColumns || searchableColumns.length === 0) {
        const searchValue = filterValue.toLowerCase();
        // Search through all string and number values
        for (const [key, value] of Object.entries(row.original)) {
          if (
            (typeof value === "string" || typeof value === "number") &&
            String(value).toLowerCase().includes(searchValue)
          ) {
            return true;
          }
        }
        return false;
      }

      // Otherwise, only search in specified columns
      const searchValue = filterValue.toLowerCase();
      return searchableColumns.some((columnKey) => {
        const value = row.original[columnKey];
        return (
          (typeof value === "string" || typeof value === "number") &&
          String(value).toLowerCase().includes(searchValue)
        );
      });
    },
    [searchableColumns],
  );

  // Automatically generate columns based on the first data item
  const generateColumns = React.useCallback((): ColumnDef<TData>[] => {
    if (!data.length) return [];
    if (customColumns) return customColumns;

    const sampleData = data[0];
    const cols: ColumnDef<TData>[] = [];

    // Add selection column if enabled
    if (enableRowSelection) {
      cols.push({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      });
    }

    // Generate columns for each property in the data
    Object.keys(sampleData).forEach((key) => {
      if (excludeColumns.includes(key)) return;

      const value = sampleData[key];
      const isDate =
        value instanceof Date ||
        (typeof value === "string" && !isNaN(Date.parse(value)));

      const config = columnConfigMap[key];
      const enableSorting = config?.enableSorting !== false; // Default to true if not specified

      cols.push({
        accessorKey: key,
        header: ({ column }) => {
          // Only add sorting button if sorting is enabled for this column
          if (enableSorting) {
            return (
              <Button
                variant="ghost"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                {config?.header ??
                  key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                <ChevronsUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          }

          // Return just the text without sorting functionality
          return (
            <div className="px-1">
              {config?.header ??
                key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
            </div>
          );
        },
        cell: ({ row }) => {
          const value = row.getValue(key);
          const config = columnConfigMap[key];

          // Use custom renderer if provided
          if (config?.customRender) {
            return <div>{config.customRender(value, row.original)}</div>;
          }

          // Format dates
          if (isDate && value) {
            return <div><ClientDate date={value as string} /></div>;
          }

          // Format booleans
          if (typeof value === "boolean") {
            return <div>{value ? "Yes" : "No"}</div>;
          }

          // Format strings, numbers, etc.
          return (
            <div
              style={
                config?.maxWidth
                  ? {
                      maxWidth: `${config.maxWidth}px`,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }
                  : {}
              }
            >
              {String(value || "")}
            </div>
          );
        },
        enableSorting,
      });
    });

    // Add actions column if we have actions
    if (actionItems.length > 0) {
      cols.push({
        id: "actions",
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => {
          const rowData = row.original;

          return (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{actionLabel}</DropdownMenuLabel>
                  {actionItems.map((item, index) => {
                    // Determine if we need to add a separator before this item
                    const isSecondToLast =
                      separateLastAction && index === actionItems.length - 2;

                    return (
                      <React.Fragment key={index}>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            item.onClick(rowData);
                          }}
                        >
                          {item.customRender
                            ? item.customRender(rowData)
                            : item.label}
                        </DropdownMenuItem>

                        {/* Add separator after second-to-last item if separateLastAction is enabled */}
                        {isSecondToLast && <DropdownMenuSeparator />}
                      </React.Fragment>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      });
    }

    return cols;
  }, [
    data,
    excludeColumns,
    actionItems,
    actionLabel,
    enableRowSelection,
    customColumns,
    columnConfigMap,
    separateLastAction,
  ]);

  const columns = React.useMemo(() => generateColumns(), [generateColumns]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    initialState: {
      pagination: {
        pageSize: maxRowsPerPage,
      },
      columnVisibility: defaultHiddenColumns.reduce((acc, column) => {
        acc[column] = false;
        return acc;
      }, {} as VisibilityState),
    },
    globalFilterFn: customGlobalFilterFn,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    getRowId,
  });

  // Update data when props change
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const selectedRows = getRowId
    ? data.filter((row, idx) => (selectedRowIds ?? []).includes(getRowId(row, idx)))
    : [];

  const showDefaultBulkDelete =
    enableRowSelection &&
    typeof onBulkDelete === "function" &&
    (selectedRowIds?.length ?? 0) > 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 py-4">
        {(selectedRowIds?.length ?? 0) > 0 && bulkActions && (
          <div>
            {bulkActions(selectedRowIds ?? [], selectedRows)}
          </div>
        )}

        <div className="flex items-center gap-2">
          {showDefaultBulkDelete && (
            <Button
              variant="outline"
              onClick={() => onBulkDelete && onBulkDelete(selectedRowIds ? selectedRowIds : [], selectedRows)}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete {(selectedRowIds ? selectedRowIds : []).length} Rows
            </Button>
          )}
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="flex-grow min-w-[220px]"
          />
        </div>


        
        

        {/* Wrap Columns dropdown and customHeaderContent in a flex-row with a small gap */}
        <div className="flex items-center gap-2">
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Columns <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {customHeaderContent}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={
                    onRowClick ? "hover:bg-muted/50 cursor-pointer" : ""
                  }
                  onClick={() => onRowClick && onRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {enablePagination && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="text-muted-foreground flex-1 text-sm">
            {enableRowSelection && (
              <>
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </>
            )}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
