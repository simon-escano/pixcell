import { MetaPatient, MetaProfile, MetaSample, MetaSampleImage } from "@/app/samples/types";
import { generateColorFromId } from "@/utils";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { image, patient, profile, role, sample, sampleImage } from "@/db/schema";

export async function getUserMetaByUserId(userId: string) {
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

  const userMeta = {
    id: user.id,
    info: {
      name: `${user.firstName} ${user.lastName}`,
      color: generateColorFromId(user.id),
      avatar: user.imageUrl,
    },
  }

  console.log(userMeta);

  return userMeta;
}

export async function getMetaSampleById(id: string): Promise<MetaSample | undefined> {
  const result = await db
    .select({
      id: sample.id,
      sampleName: sample.sampleName,
      patientId: sample.patientId,
      createdById: sample.createdBy,
      createdAt: sample.createdAt,
    })
    .from(sample)
    .where(eq(sample.id, id));

  const row = result[0];
  if (!row) return undefined;

  const [patient, createdBy] = await Promise.all([
    getMetaPatientById(row.patientId),
    getMetaProfileByUserId(row.createdById),
  ]);

  return {
    id: row.id,
    sampleName: row.sampleName,
    patient,
    createdBy,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : undefined,
  };
}

export async function getMetaProfileByUserId(userId: string): Promise<MetaProfile | undefined> {
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
    .leftJoin(role, eq(profile.roleId, role.id))
    .where(eq(profile.userId, userId));

  const row = result[0];
  if (!row) return undefined;

  return {
    id: row.id,
    fullName: `${row.firstName} ${row.lastName}`,
    role: row.role!,
    imageUrl: row.imageUrl,
  };
}

export async function getMetaPatientById(id: string): Promise<MetaPatient | undefined> {
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
    birthDate: row.birthDate,
    sex: row.sex,
    contactNumber: row.contactNumber,
    email: row.email,
    address: row.address,
    height: row.height,
    weight: row.weight,
    bloodType: row.bloodType,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}

export async function getMetaSampleImagesBySampleId(sampleId: string): Promise<MetaSampleImage[]> {
  const results = await db
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
    .where(eq(sampleImage.sampleId, sampleId));

  const metaImages: MetaSampleImage[] = await Promise.all(
    results.map(async (row) => {
      const meta = row.metadata as { type?: string; width?: number; height?: number };

      let profile: MetaProfile | null = null;
      if (row.uploadedBy) {
        const resolved = await getMetaProfileByUserId(row.uploadedBy);
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
}

