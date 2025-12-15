"use client";

import { Search } from "lucide-react";
import { Input } from "./ui/input";

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const SearchInput = ({ placeholder = "Search...", value, onChange, className }: SearchInputProps) => {
  return (
    <div className={`relative flex-1 max-w-sm h-full ${className || ""}`}>
      <Search className="absolute left-0 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-6 pr-3 h-full bg-transparent! border-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
      />
    </div>
  );
};

export default SearchInput;

