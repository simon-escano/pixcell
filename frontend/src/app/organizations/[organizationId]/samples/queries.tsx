import { generateColorFromId } from "@/utils";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { image, patient, profile, role, sample, sampleImage, organizationStaff } from "@/db/schema";
import { MetaPatient, MetaProfile, MetaSample, MetaSampleImage } from "./types";
import { withCache, CACHE_TAGS, CACHE_REVALIDATE_TIMES } from "@/lib/cache";

// Cached version for request deduplication
const getUserMetaByUserIdCached = (userId: string) => withCache(
  async () => {
    const result = await db
      .select({
        id: profile.userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        imageUrl: image.imageUrl,
      })
      .from(profile)
      .leftJoin(image, eq(profile.imageId, image.id))
      .where(eq(profile.userId, userId));

    const user = result[0];
    if (!user) return null;

    return {
      id: user.id,
      info: {
        name: `${user.firstName} ${user.lastName}`,
        color: generateColorFromId(user.id),
        avatar: user.imageUrl,
      },
    };
  },
  ['user-meta', userId],
  {
    tags: [CACHE_TAGS.profiles, `user-${userId}`],
    revalidate: CACHE_REVALIDATE_TIMES.medium,
  }
)();

export async function getUserMetaByUserId(userId: string) {
  const userMeta = await getUserMetaByUserIdCached(userId);
  if (!userMeta) return null;
  
  console.log(userMeta);
  return userMeta;
}

const getMetaSampleByIdCached = withCache(
  async (id: string): Promise<MetaSample | undefined> => {
    const result = await db
      .select({
        id: sample.id,
        sampleName: sample.sampleName,
        patientId: sample.patientId,
        createdById: sample.createdBy,
        organizationId: sample.organizationId,
        createdAt: sample.createdAt,
      })
      .from(sample)
      .where(eq(sample.id, id));

    const row = result[0];
    if (!row) return undefined;

    // Parallelize independent queries
    const [patientData, createdByData] = await Promise.all([
      getMetaPatientById(row.patientId),
      getMetaProfileByUserId(row.createdById, row.organizationId),
    ]);

    return {
      id: row.id,
      sampleName: row.sampleName,
      patient: patientData,
      createdBy: createdByData,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : undefined,
    };
  },
  ['meta-sample'],
  {
    tags: [CACHE_TAGS.samples],
    revalidate: CACHE_REVALIDATE_TIMES.medium,
  }
);

export async function getMetaSampleById(id: string): Promise<MetaSample | undefined> {
  return getMetaSampleByIdCached(id);
}

const getMetaProfileByUserIdCached = withCache(
  async (userId: string, organizationId?: string): Promise<MetaProfile | undefined> => {
    if (organizationId) {
      const result = await db
        .select({
          id: profile.userId,
          firstName: profile.firstName,
          lastName: profile.lastName,
          role: role.name,
          imageUrl: image.imageUrl,
        })
        .from(profile)
        .leftJoin(image, eq(profile.imageId, image.id))
        .innerJoin(organizationStaff, eq(organizationStaff.staffId, profile.id))
        .innerJoin(role, eq(organizationStaff.roleId, role.id))
        .where(
          and(
            eq(profile.userId, userId),
            eq(organizationStaff.organizationId, organizationId)
          )
        );

      const row = result[0];
      if (!row) return undefined;

      return {
        id: row.id,
        fullName: `${row.firstName} ${row.lastName}`,
        role: row.role || "Unknown",
        imageUrl: row.imageUrl,
      };
    } else {
      // If no organizationId, don't join role - return "Unknown" for role
      const result = await db
        .select({
          id: profile.userId,
          firstName: profile.firstName,
          lastName: profile.lastName,
          imageUrl: image.imageUrl,
        })
        .from(profile)
        .leftJoin(image, eq(profile.imageId, image.id))
        .where(eq(profile.userId, userId));

      const row = result[0];
      if (!row) return undefined;

      return {
        id: row.id,
        fullName: `${row.firstName} ${row.lastName}`,
        role: "Unknown",
        imageUrl: row.imageUrl,
      };
    }
  },
  ['meta-profile'],
  {
    tags: [CACHE_TAGS.profiles],
    revalidate: CACHE_REVALIDATE_TIMES.medium,
  }
);

export async function getMetaProfileByUserId(userId: string, organizationId?: string): Promise<MetaProfile | undefined> {
  return getMetaProfileByUserIdCached(userId, organizationId);
}

const getMetaPatientByIdCached = withCache(
  async (id: string): Promise<MetaPatient | undefined> => {
    const result = await db
      .select({
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        imageUrl: image.imageUrl,
        birthDate: patient.birthDate,
        sex: patient.sex,
        contactNumber: patient.contactNumber,
        email: patient.email,
        address: patient.address,
        height: patient.height,
        weight: patient.weight,
        bloodType: patient.bloodType,
        createdAt: patient.createdAt,
        createdBy: patient.createdBy,
      })
      .from(patient)
      .leftJoin(image, eq(patient.imageId, image.id))
      .where(eq(patient.id, id));

    const row = result[0];
    if (!row) return undefined;

    return {
      id: row.id,
      fullName: `${row.firstName} ${row.lastName}`,
      role: "Patient",
      imageUrl: row.imageUrl,
      birthDate: row.birthDate ?? "",
      sex: row.sex,
      contactNumber: row.contactNumber ?? "",
      email: row.email ?? "",
      address: row.address ?? "",
      height: row.height ?? 0,
      weight: row.weight ?? 0,
      bloodType: row.bloodType ?? "",
      createdAt: row.createdAt,
      createdBy: row.createdBy,
    };
  },
  ['meta-patient'],
  {
    tags: [CACHE_TAGS.patients],
    revalidate: CACHE_REVALIDATE_TIMES.medium,
  }
);

export async function getMetaPatientById(id: string): Promise<MetaPatient | undefined> {
  return getMetaPatientByIdCached(id);
}

const getMetaSampleImagesBySampleIdCached = withCache(
  async (sampleId: string): Promise<MetaSampleImage[]> => {
    // Parallelize: get sample and sample images simultaneously
    const [sampleResult, imageResults] = await Promise.all([
      db
        .select({ organizationId: sample.organizationId })
        .from(sample)
        .where(eq(sample.id, sampleId))
        .limit(1),
      db
        .select({
          id: sampleImage.id,
          sampleId: sampleImage.sampleId,
          uploadedBy: sampleImage.uploadedBy,
          metadata: sampleImage.metadata,
          capturedAt: sampleImage.capturedAt,
          imageUrl: image.imageUrl,
        })
        .from(sampleImage)
        .leftJoin(image, eq(sampleImage.imageId, image.id))
        .where(eq(sampleImage.sampleId, sampleId)),
    ]);

    const organizationId = sampleResult[0]?.organizationId;

    // Parallelize profile lookups for all uploadedBy users
    const metaImages: MetaSampleImage[] = await Promise.all(
      imageResults.map(async (row) => {
        const meta = row.metadata as { type?: string; width?: number; height?: number };

        let profile: MetaProfile | null = null;
        if (row.uploadedBy) {
          const resolved = await getMetaProfileByUserId(row.uploadedBy, organizationId);
          profile = resolved ?? null;
        }

        return {
          id: row.id,
          sampleId: row.sampleId,
          uploadedBy: profile,
          capturedAt: row.capturedAt ? row.capturedAt.toLocaleString() : "",
          imageUrl: row.imageUrl,
          metadata: {
            type: meta.type ?? "",
            width: meta.width ?? 0,
            height: meta.height ?? 0,
          },
        };
      })
    );

    return metaImages;
  },
  ['meta-sample-images'],
  {
    tags: [CACHE_TAGS.samples],
    revalidate: CACHE_REVALIDATE_TIMES.medium,
  }
);

export async function getMetaSampleImagesBySampleId(sampleId: string): Promise<MetaSampleImage[]> {
  return getMetaSampleImagesBySampleIdCached(sampleId);
}

