import Base from "@/components/base"
import { getOrganizationById, getAllSamples, getAllReports, getAllUsersWithProfiles, getPatientGenderStats, getAllPatientsForUser } from "@/db/queries/select"
import type { Metadata } from "next"
import { MapPin, FileText, Images, Users, UserCircle, ArrowRight, Calendar, Tag } from "lucide-react"
import { AvatarStack } from "@/components/avatar-stack"
import Link from "next/link"
import { format } from "date-fns"
import { db } from "@/db"
import { organizationPatient, patient, image } from "@/db/schema"
import { eq } from "drizzle-orm"
import { OrganizationBanner } from "@/components/organization-banner"
import { getUser } from "@/lib/auth"
import { getMetaProfileByUserId, getMetaSampleById, getMetaSampleImagesBySampleId } from "./samples/queries"
import SampleCard from "@/components/samples/sample-card"
import { getProfileByUserId, getRoleByUserIdAndOrganizationId } from "@/db/queries/select"
import AdminDashboardAnalytics from "@/components/dashboard/AdminDashboardAnalytics"
import { DashboardAnalytics } from "@/components/dashboard/DashboardAnalytics"
import { createClient } from "@supabase/supabase-js"

function truncate(text: string, maxLength = 50): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + "..."
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ organizationId: string }>
}): Promise<Metadata> {
  const paramsObj = await params
  const organization = await getOrganizationById(paramsObj.organizationId)
  const orgName = organization?.name ? truncate(organization.name) : "Organization"

  return {
    title: `PixCell | ${orgName}`,
  }
}

import { cache } from "react";

// Cache at request level for deduplication
const getAllPatientsForOrganizationCached = cache(async (organizationId: string) => {
  return await db
    .select({
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      imageUrl: image.imageUrl,
    })
    .from(organizationPatient)
    .innerJoin(patient, eq(organizationPatient.patientId, patient.id))
    .leftJoin(image, eq(patient.imageId, image.id))
    .where(eq(organizationPatient.organizationId, organizationId))
});

async function getAllPatientsForOrganization(organizationId: string) {
  return getAllPatientsForOrganizationCached(organizationId);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key on server only!
)

async function getSupabaseStorageUsage(bucket: string) {
  let total = 0
  let page = 0
  let hasMore = true
  while (hasMore) {
    const { data, error } = await supabase.storage.from(bucket).list("", { limit: 1000, offset: page * 1000 })
    if (error) throw error
    if (!data || data.length === 0) break
    for (const file of data) {
      if (file.metadata && file.metadata.size) {
        total += file.metadata.size
      }
    }
    hasMore = data.length === 1000
    page++
  }
  return total
}

const ROLE_COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // green-500
  "#f59e42", // orange-400
  "#6366f1", // indigo-500
  "#ef4444", // red-500
  "#a855f7", // purple-500
  "#fbbf24", // yellow-400
]

const OrganizationPage = async ({
  params,
}: {
  params: Promise<{ organizationId: string }>
}) => {
  const paramsObj = await params
  const organizationId = paramsObj.organizationId
  const organization = await getOrganizationById(organizationId)

  // Parallelize all initial data fetching
  const [user, samples, reports, users, patients] = await Promise.all([
    getUser(),
    getAllSamples(organizationId),
    getAllReports(organizationId),
    getAllUsersWithProfiles(organizationId),
    getAllPatientsForOrganization(organizationId),
  ])

  // Get user profile and role for dashboard
  const [profile, role] = await Promise.all([
    getProfileByUserId(user.id),
    getRoleByUserIdAndOrganizationId(user.id, organizationId),
  ])

  // Fetch dashboard data (only if needed)
  const isAdmin = role?.name === "Administrator"
  const dashboardData = isAdmin ? await Promise.all([
    getAllPatientsForUser(profile.id, "Administrator", organizationId),
    getPatientGenderStats(organizationId),
    (async () => {
      try {
        const storageUsed = await getSupabaseStorageUsage("sample-images")
        const storageUsedMB = (storageUsed / (1024 * 1024)).toFixed(2)
        const storageCapacityMB = 5 * 1024 // Assume 5GB total storage
        const storageFreeMB = storageCapacityMB - Number.parseFloat(storageUsedMB)
        return { storageUsedMB, storageCapacityMB, storageFreeMB }
      } catch (e) {
        return { storageUsedMB: "0", storageCapacityMB: 5 * 1024, storageFreeMB: 5 * 1024 }
      }
    })(),
  ]) : null

  // Prepare admin dashboard props if admin
  const adminDashboardProps = isAdmin && dashboardData ? (() => {
    const [adminPatients, genderStats, storageInfo] = dashboardData
    const roleMap: Record<string, number> = {}
    users.forEach((u) => {
      if (!u.roleName) return
      roleMap[u.roleName] = (roleMap[u.roleName] || 0) + 1
    })
    const roleCounts = Object.entries(roleMap).map(([role, count], i) => ({
      role,
      count,
      color: ROLE_COLORS[i % ROLE_COLORS.length],
    }))

    return {
      storageUsedMB: storageInfo.storageUsedMB,
      storageCapacityMB: storageInfo.storageCapacityMB,
      storageFreeMB: storageInfo.storageFreeMB,
      roleCounts,
      genderStats,
    }
  })() : null

  // Get current user's meta profile in parallel with other operations
  const [currentUserMeta] = await Promise.all([
    getMetaProfileByUserId(user.id, organizationId)
  ])

  // Get recent samples with full meta data and images - optimize by limiting upfront
  const recentSamplesRaw = [...samples]
    .sort((a, b) => {
      const dateA = a.createdAt
        ? a.createdAt instanceof Date
          ? a.createdAt.getTime()
          : new Date(a.createdAt).getTime()
        : 0
      const dateB = b.createdAt
        ? b.createdAt instanceof Date
          ? b.createdAt.getTime()
          : new Date(b.createdAt).getTime()
        : 0
      return dateB - dateA
    })
    .slice(0, 5)

  // Parallelize all sample meta and image fetching
  const recentSamplesWithMeta = await Promise.all(
    recentSamplesRaw.map(async (sample) => {
      // Fetch both meta and images in parallel for each sample
      const [metaSample, sampleImages] = await Promise.all([
        getMetaSampleById(sample.id),
        getMetaSampleImagesBySampleId(sample.id)
      ])
      return {
        metaSample,
        sampleImages,
      }
    })
  )

  // Filter out any undefined meta samples
  const recentSamples = recentSamplesWithMeta
    .filter((item) => item.metaSample !== undefined)
    .map((item) => ({
      metaSample: item.metaSample!,
      sampleImages: item.sampleImages,
    }))

  const recentReports = [...reports]
    .sort((a, b) => {
      const dateA = a.createdAt
        ? a.createdAt instanceof Date
          ? a.createdAt.getTime()
          : new Date(a.createdAt).getTime()
        : 0
      const dateB = b.createdAt
        ? b.createdAt instanceof Date
          ? b.createdAt.getTime()
          : new Date(b.createdAt).getTime()
        : 0
      return dateB - dateA
    })
    .slice(0, 5)
    .map((report) => ({
      id: report.id,
      title: report.title || null,
      testType: report.testType || null,
      createdAt: report.createdAt
        ? report.createdAt instanceof Date
          ? report.createdAt.toISOString()
          : String(report.createdAt)
        : null,
    }))

  const doctors = users.filter((u) => u.roleName !== "Administrator")

  const patientAvatars = patients.map((p) => ({
    name: `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Unknown",
    image: p.imageUrl || "",
  }))

  const doctorAvatars = doctors.map((d) => ({
    name: `${d.firstName || ""} ${d.lastName || ""}`.trim() || "Unknown",
    image: d.imageUrl || "",
  }))

  return (
    <Base params={paramsObj}>
      <div className="h-full overflow-y-auto">
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-10">
          <OrganizationBanner
            name={organization?.name || null}
            address={organization?.address || null}
            imageUrl={organization?.image_url || null}
            samples={samples.length}
            reports={reports.length}
            patients={patients.length}
            users={users.length}
          />
        </div>

        <div className="p-4 sm:p-6 md:p-8 lg:p-10">
          <div className="max-w-7xl mx-auto space-y-10">
            {/* Patients & Staff - Side by Side Showcases */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Patients */}
              <section>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Users className="size-5 text-primary" />
                    <h2 className="text-lg font-semibold">Patients</h2>
                  </div>
                  <Link
                    href={`/organizations/${organizationId}/patients`}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    View all
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
                {patientAvatars.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-12">
                    <p className="text-sm text-muted-foreground text-center">No patients yet</p>
                  </div>
                ) : (
                  <Link
                    href={`/organizations/${organizationId}/patients`}
                    className="group block p-6 rounded-lg border border-border hover:border-foreground/20 hover:bg-accent/30 transition-all duration-200"
                  >
                    <div className="flex items-end justify-between mb-4">
                      <div className="flex-1">
                        <AvatarStack avatars={patientAvatars} maxAvatarsAmount={6} />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-semibold">{patients.length}</p>
                      <p className="text-sm text-muted-foreground">{patients.length === 1 ? "patient" : "patients"}</p>
                    </div>
                  </Link>
                )}
              </section>

              {/* Medical Staff */}
              <section>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <UserCircle className="size-5 text-primary" />
                    <h2 className="text-lg font-semibold">Medical Staff</h2>
                  </div>
                  <Link
                    href={`/organizations/${organizationId}/users`}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    View all
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
                {doctorAvatars.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-12">
                    <p className="text-sm text-muted-foreground text-center">No staff members yet</p>
                  </div>
                ) : (
                  <Link
                    href={`/organizations/${organizationId}/users`}
                    className="group block p-6 rounded-lg border border-border hover:border-foreground/20 hover:bg-accent/30 transition-all duration-200"
                  >
                    <div className="flex items-end justify-between mb-4">
                      <div className="flex-1">
                        <AvatarStack avatars={doctorAvatars} maxAvatarsAmount={6} />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-semibold">{doctors.length}</p>
                      <p className="text-sm text-muted-foreground">{doctors.length === 1 ? "member" : "members"}</p>
                    </div>
                  </Link>
                )}
              </section>
            </div>

            {/* Recent Samples - Card Grid */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Images className="size-5 text-primary" />
                  <h2 className="text-lg font-semibold">Recent Samples</h2>
                </div>
                <Link
                  href={`/organizations/${organizationId}/samples`}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  View all
                  <ArrowRight className="size-3" />
                </Link>
              </div>
              {recentSamples.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8">
                  <p className="text-sm text-muted-foreground text-center">No samples yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {recentSamples.map(({ metaSample, sampleImages }) => {
                    if (!metaSample || !currentUserMeta) return null
                    return (
                      <SampleCard
                        key={metaSample.id}
                        currentUser={currentUserMeta}
                        sample={metaSample}
                        sampleImages={sampleImages}
                      />
                    )
                  })}
                </div>
              )}
            </section>

            {/* Recent Reports - Detailed List */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <FileText className="size-5 text-primary" />
                  <h2 className="text-lg font-semibold">Recent Reports</h2>
                </div>
                <Link
                  href={`/organizations/${organizationId}/reports`}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  View all
                  <ArrowRight className="size-3" />
                </Link>
              </div>
              {recentReports.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8">
                  <p className="text-sm text-muted-foreground text-center">No reports yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentReports.map((report, index) => (
                    <Link
                      key={report.id}
                      href={`/organizations/${organizationId}/reports/${report.id}`}
                      className="group flex items-center gap-4 p-4 rounded-lg border border-transparent hover:border-border hover:bg-accent/50 transition-all duration-200"
                    >
                      <div className="flex-shrink-0 text-xs font-semibold text-muted-foreground w-6 h-6 flex items-center justify-center rounded-full bg-muted">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors">
                          {report.title || report.testType || "Untitled Report"}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          {report.testType && (
                            <div className="flex items-center gap-1">
                              <Tag className="size-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{report.testType}</span>
                            </div>
                          )}
                          {report.createdAt && (
                            <div className="flex items-center gap-1">
                              <Calendar className="size-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(report.createdAt as string), "MMM d, yyyy")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Dashboard Analytics Section */}
            <section className="pt-8 border-t">
              <div className="mb-6">
                <h2 className="text-lg font-semibold">Analytics & Insights</h2>
                <p className="text-sm text-muted-foreground">Organization metrics and statistics</p>
              </div>
              {isAdmin && adminDashboardProps ? (
                <AdminDashboardAnalytics {...adminDashboardProps} />
              ) : (
                <DashboardAnalytics organizationId={organizationId} />
              )}
            </section>
          </div>
        </div>
      </div>
    </Base>
  )
}

export default OrganizationPage
