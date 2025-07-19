import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { patient } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const patients = await req.json();
    if (!Array.isArray(patients)) {
      return NextResponse.json({ message: "Invalid data format" }, { status: 400 });
    }
    const results = [];
    for (const p of patients) {
      // Validate required fields
      if (!p.firstName || !p.lastName || !p.email || !p.birthDate || !p.sex || !p.contactNumber || !p.address || !p.height || !p.weight || !p.bloodType) {
        results.push({ email: p.email, success: false, error: "Missing required fields" });
        continue;
      }
      // Check if email already exists
      const existing = await db.select().from(patient).where(eq(patient.email, p.email)).limit(1);
      if (existing.length > 0) {
        results.push({ email: p.email, success: false, error: "Email already exists" });
        continue;
      }
      try {
        await db.insert(patient).values({
          id: uuidv4(),
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          birthDate: p.birthDate,
          sex: p.sex,
          contactNumber: p.contactNumber,
          address: p.address,
          height: Number(p.height),
          weight: Number(p.weight),
          bloodType: p.bloodType,
          imageId: p.imageId || null,
          noteId: p.noteId || null,
          createdBy: p.createdBy || null,
        });
        results.push({ email: p.email, success: true });
      } catch (err: any) {
        results.push({ email: p.email, success: false, error: err.message });
      }
    }
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Server error" }, { status: 500 });
  }
} 