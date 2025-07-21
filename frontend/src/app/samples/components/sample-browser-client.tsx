"use client"

import React, { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Grid3X3,
  List,
  Calendar,
  Users,
  Activity,
  FileImage,
  Plus,
  TrendingUp,
  AlertCircle,
  Clock,
} from "lucide-react"
import SampleCard from "./sample-card"
import { DataTable } from "@/components/data-table"

// Loading skeleton component
const SampleCardSkeleton = () => (
  <Card className="animate-pulse">
    <CardContent className="p-4">
      <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded w-12"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </CardContent>
  </Card>
)

export default function SampleBrowserClient({ samples, currentUser }: { samples: any[]; currentUser: any }) {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sort, setSort] = useState("newest")
  // Optionally: grid/list view state
  const [view, setView] = useState<'grid'|'table'>("grid")
  // Add state for pagination
  const PAGE_SIZE = 15;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Filtering and sorting logic
  const filteredSamples = useMemo(() => {
    let filtered = samples
    // Debug: log incoming samples
    console.log('samples', samples)
    // Filter by type (get type from first sampleImage's metadata.type if available)
    if (typeFilter !== "all") {
      filtered = filtered.filter(s => {
        const type = (s.sampleImages && s.sampleImages[0] && s.sampleImages[0].metadata && s.sampleImages[0].metadata.type) || ""
        return type.toLowerCase().trim() === typeFilter
      })
    }
    // Search by name, patient, or ID (map to actual fields)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter(s => {
        const name = (s.sampleName || "").toLowerCase()
        const patient = (s.patient && s.patient.fullName ? s.patient.fullName : "").toLowerCase()
        const doctor = (s.createdBy && s.createdBy.fullName ? s.createdBy.fullName : "").toLowerCase()
        const id = (s.id || "").toLowerCase()
        return name.includes(q) || patient.includes(q) || doctor.includes(q) || id.includes(q)
      })
    }
    // Sort
    if (sort === "newest") {
      filtered = filtered.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (sort === "oldest") {
      filtered = filtered.slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } else if (sort === "name") {
      filtered = filtered.slice().sort((a, b) => (a.sampleName || "").localeCompare(b.sampleName || ""))
    } else if (sort === "patient") {
      filtered = filtered.slice().sort((a, b) => ((a.patient && a.patient.fullName) || "").localeCompare((b.patient && b.patient.fullName) || ""))
    }
    // Debug: log filtered samples
    console.log('filteredSamples', filtered)
    return filtered
  }, [samples, search, typeFilter, sort])

  // Only show up to visibleCount samples in grid view
  const paginatedSamples = useMemo(() => {
    return filteredSamples.slice(0, visibleCount);
  }, [filteredSamples, visibleCount]);

  return (
    <>
      {/* Search and Filter Bar */}
      <Card
        className="backdrop-blur-sm shadow-lg hover:shadow-xl transition-all"
        style={{ background: "var(--card)", border: "2px solid var(--border)" }}
      >
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search samples by name, patient, doctor, or ID..."
                className="pl-10 bg-white border-gray-200 focus:border-blue-400"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40 bg-white">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="blood">Blood Smear</SelectItem>
                  <SelectItem value="tissue">Tissue</SelectItem>
                  <SelectItem value="fluid">Body Fluid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-40 bg-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="patient">Patient Name</SelectItem>
                </SelectContent>
              </Select>

              <Separator orientation="vertical" className="h-8" />

              <div className="flex items-center gap-1">
                <Button
                  variant={view === "grid" ? "outline" : "ghost"}
                  size="sm"
                  className="p-2 bg-transparent"
                  onClick={() => setView("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={view === "table" ? "outline" : "ghost"}
                  size="sm"
                  className="p-2"
                  onClick={() => setView("table")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Samples View */}
      {view === "grid" ? (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6">
          {filteredSamples.length === 0 ? (
            <Card className="col-span-full bg-white/50 backdrop-blur-sm border-2 border-dashed border-gray-300">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileImage className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No samples found</h3>
                <p className="text-gray-500 text-center mb-6 max-w-md">
                  Get started by creating your first sample. Upload images and begin your analysis journey.
                </p>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Sample
                </Button>
              </CardContent>
            </Card>
          ) : (
            paginatedSamples.map(sample => (
              <div key={sample.id} className="group">
                <SampleCard currentUser={currentUser} sample={sample} sampleImages={sample.sampleImages || []} />
              </div>
            ))
          )}
        </div>
        {/* Load More Button for grid view */}
        {filteredSamples.length > visibleCount && (
          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              className="px-8 py-3 bg-white/80 backdrop-blur-sm border-2 border-white shadow-lg hover:shadow-xl transition-all"
              onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
            >
              Load More Samples
              <TrendingUp className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
        </>
      ) : (
        <div className="mt-6">
          <DataTable
            data={filteredSamples.map(s => ({
              name: s.sampleName,
              patient: s.patient?.fullName || "",
              doctor: s.createdBy?.fullName || "",
              type: (s.sampleImages && s.sampleImages[0]?.metadata?.type) || "",
              createdAt: s.createdAt,
              images: s.sampleImages?.length || 0,
            }))}
            columnConfigs={[
              { key: "name", header: "Sample Name" },
              { key: "patient", header: "Patient" },
              { key: "doctor", header: "Doctor" },
              { key: "type", header: "Type" },
              { key: "createdAt", header: "Created At" },
              { key: "images", header: "Images" },
            ]}
            searchPlaceholder=""
            enableRowSelection={false}
            enableColumnVisibility={false}
            enablePagination={true}
            customHeaderContent={<></>}
            hideSearchInput={true}
          />
        </div>
      )}
    </>
  )
} 