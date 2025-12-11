"use client"

import type React from "react"

import AdminDashboardCompact from "./AdminDashboardCompact"

interface AdminDashboardClientProps {
  mainMetrics: Array<{
    title: string
    value: number
    icon: React.ReactNode
  }>
  storageUsedMB: string
  storageCapacityMB: number
  storageFreeMB: number
  roleCounts: Array<{
    role: string
    count: number
    color: string
  }>
  genderStats: Array<{
    gender: string
    count: number
    month: string
  }>
}

export default function AdminDashboardClient(props: AdminDashboardClientProps) {
  return <AdminDashboardCompact {...props} />
}
