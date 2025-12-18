"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface PageSidebarContextType {
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
  hasSidebar: boolean
  setHasSidebar: (has: boolean) => void
}

const PageSidebarContext = createContext<PageSidebarContextType | undefined>(undefined)

export function PageSidebarProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [hasSidebar, setHasSidebar] = useState(false)

  return (
    <PageSidebarContext.Provider value={{ isSidebarOpen, setIsSidebarOpen, hasSidebar, setHasSidebar }}>
      {children}
    </PageSidebarContext.Provider>
  )
}

export function usePageSidebar() {
  const context = useContext(PageSidebarContext)
  if (context === undefined) {
    throw new Error("usePageSidebar must be used within a PageSidebarProvider")
  }
  return context
}
