"use client";

import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { X, Trash2 } from "lucide-react";
import React from "react";

interface SelectionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete: () => void;
  deleteLabel?: string;
  className?: string;
}

const SelectionBar = ({
  selectedCount,
  onClearSelection,
  onDelete,
  deleteLabel = "Delete",
  className,
}: SelectionBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div
      className={`absolute bottom-5 left-1/2 -translate-x-1/2 p-2 bg-card flex gap-2 items-center rounded-md shadow-md z-10 border border-card-border ${className || ""}`}
    >
      <div className="flex h-7 items-center">
        <div className="flex h-full border border-card-border border-dashed rounded-l-sm items-center justify-center px-3">
          <p className="text-xs text-muted-foreground">
            {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
          </p>
        </div>
        {/* clear selection */}
        <button
          onClick={onClearSelection}
          className="h-full flex rounded-r-sm border border-card-border border-dashed border-l-0 hover:bg-card-hover cursor-pointer transition-colors items-center justify-center px-2"
        >
          <X className="size-3 text-card-icon hover:text-card-foreground transition-colors" />
        </button>
      </div>
      <div className="w-px h-5.5 bg-card-border"></div>
      <Button variant="destructive" size="sm" onClick={onDelete}>
        <Trash2 className="size-4" />
        {deleteLabel}
      </Button>
    </div>
  );
};

export default SelectionBar;

