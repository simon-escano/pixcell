"use server";

import { db } from "@/db";
import { sample } from "@/db/schema";
import { writeFile } from "fs/promises";
import path from "path";
import sizeOf from "image-size";
import { getUser } from "@/lib/auth";

export async function uploadSampleAction(
  patientId: string,
  file: File
) {
  const currentUser = await getUser();
  if (!file || !patientId) throw new Error("Missing fields");

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileName = `${Date.now()}-${file.name}`;
  const filePath = path.join(process.cwd(), "public/uploads", fileName);

  await writeFile(filePath, buffer);

  const dimensions = sizeOf(buffer);

  const imageUrl = `/uploads/${fileName}`;

  await db.insert(sample).values({
    patientId,
    uploadedBy: currentUser?.id,
    metadata: dimensions,
    imageUrl,
  });
}
