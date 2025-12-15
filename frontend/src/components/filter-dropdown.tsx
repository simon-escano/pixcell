"use client";

import { SlidersHorizontal, ArrowUpWideNarrow, ArrowDownWideNarrow } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Toggle } from "./ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

export type SortDirection = "asc" | "desc";

export interface SortFieldOption {
  value: string;
  label: string;
}

export interface DisplayPropertyOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  sortFields: SortFieldOption[];
  sortField: string;
  onSortFieldChange: (field: string) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: (direction: SortDirection) => void;
  displayProperties: DisplayPropertyOption[];
  visibleFields: Record<string, boolean>;
  onVisibleFieldsChange: (fields: Record<string, boolean>) => void;
  className?: string;
}

const FilterDropdown = ({
  sortFields,
  sortField,
  onSortFieldChange,
  sortDirection,
  onSortDirectionChange,
  displayProperties,
  visibleFields,
  onVisibleFieldsChange,
  className,
}: FilterDropdownProps) => {
  const toggleBadgeClassName =
    "h-auto text-xs font-normal tracking-tight py-1 px-2 rounded-sm border transition-colors data-[state=on]:bg-[#FFFFFF] data-[state=on]:hover:bg-[#F1F1F1] data-[state=on]:border-[#D1D2D2] data-[state=on]:text-[#2F2F31] data-[state=off]:bg-[#F1F1F1] data-[state=off]:text-[#5C5C5E] data-[state=off]:border-[#F1F1F1] dark:data-[state=on]:bg-[#2A2C33] dark:data-[state=on]:hover:bg-[#32353e] dark:data-[state=on]:border-[#383B42] dark:data-[state=on]:text-[#E5E6E9] dark:data-[state=off]:bg-[#1c1d1f] dark:data-[state=off]:text-[#9C9DA1] dark:data-[state=off]:border-[#25272E]";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className}>
          <SlidersHorizontal className="size-4" />
          Filters
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div>
          <div className="flex items-center">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground mb-0">
              Sort by
            </DropdownMenuLabel>
            <Toggle
              pressed={sortDirection === "asc"}
              onPressedChange={(pressed) => {
                onSortDirectionChange(pressed ? "asc" : "desc");
              }}
              size="sm"
              variant="outline"
              aria-label="Toggle sort direction"
              className="rounded-sm px-0 py-1 h-auto"
            >
              {sortDirection === "asc" ? (
                <ArrowUpWideNarrow className="size-3" />
              ) : (
                <ArrowDownWideNarrow className="size-3" />
              )}
            </Toggle>
          </div>
          <div className="p-2">
            <ToggleGroup
              type="single"
              value={sortField}
              onValueChange={(value) => {
                if (value) onSortFieldChange(value);
              }}
              className="flex flex-wrap gap-1"
            >
              {sortFields.map((field) => (
                <ToggleGroupItem
                  key={field.value}
                  value={field.value}
                  aria-label={`Sort by ${field.label}`}
                  className={toggleBadgeClassName}
                >
                  {field.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Display properties
        </DropdownMenuLabel>
        <div className="p-2">
          <ToggleGroup
            type="multiple"
            value={Object.entries(visibleFields)
              .filter(([_, visible]) => visible)
              .map(([key]) => key)}
            onValueChange={(values) => {
              const newFields: Record<string, boolean> = {};
              displayProperties.forEach((prop) => {
                newFields[prop.value] = values.includes(prop.value);
              });
              onVisibleFieldsChange(newFields);
            }}
            className="flex flex-wrap gap-1"
          >
            {displayProperties.map((prop) => (
              <ToggleGroupItem
                key={prop.value}
                value={prop.value}
                aria-label={`Toggle ${prop.label}`}
                className={toggleBadgeClassName}
              >
                {prop.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FilterDropdown;

