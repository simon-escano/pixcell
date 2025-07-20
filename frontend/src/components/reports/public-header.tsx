"use client"

import { Badge } from "@/components/ui/badge"
import { Worm, Shield, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import ThemeToggle from "@/components/theme-toggle"

export default function PublicHeader({ reportData, code }: { reportData: any; code: string }) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="bg-[var(--card)] border-b border-[var(--border)] shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--primary)] rounded-lg flex items-center justify-center">
              <Worm className="h-6 w-6 text-[var(--primary-foreground)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">PixCell Medical</h1>
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