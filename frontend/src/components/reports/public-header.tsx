"use client"

import ThemeToggle from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Shield } from "lucide-react"
import PixCellLogo from "../pixcell-logo"

export default function PublicHeader({ code }: { code: string }) {
  return (
    <div className="bg-[var(--card)] border-b border-[var(--border)] shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <PixCellLogo className="size-10" />
            <div>
              <h1 className="text-base font-normal text-[var(--foreground)]">PixCell Medical</h1>
              <p className="text-sm text-[var(--muted-foreground)]">Secure Medical Report Access</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Public Access
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 font-mono text-xs">
              {code.slice(0, 8).toUpperCase()}
            </Badge>
            {/* Theme toggle button */}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  )
} 