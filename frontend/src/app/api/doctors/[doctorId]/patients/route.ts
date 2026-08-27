import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { doctorPatient, patient } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

// GET: List all assigned patients for a doctor
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await context.params;
  if (!doctorId) return NextResponse.json({ error: "Missing doctorId" }, { status: 400 });
  
  // Parallelize: get assignments and all patients simultaneously
  const [assignments, allPatients] = await Promise.all([
    db
      .select({ patientId: doctorPatient.patientId })
      .from(doctorPatient)
      .where(eq(doctorPatient.doctorId, doctorId)),
    db.select().from(patient)
  ]);
  
  const assignedPatientIds = assignments.map((a) => a.patientId);
  
  // Return both all patients and assigned IDs
  return NextResponse.json({
    allPatients: allPatients.map((p: any) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      contactNumber: p.contactNumber,
      address: p.address,
      height: p.height,
      weight: p.weight,
      sex: p.sex,
      bloodType: p.bloodType,
      birthDate: p.birthDate,
      createdAt: p.createdAt,
      imageId: p.imageId,
      // add more fields if needed
    })),
    assignedPatientIds
  });
}

// POST: Assign a patient to a doctor
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await context.params;
  if (!doctorId) return NextResponse.json({ error: "Missing doctorId" }, { status: 400 });
  const { patientId } = await req.json();
  if (!patientId) return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
  // Insert assignment if not exists
  await db.insert(doctorPatient).values({ doctorId, patientId });
  
  // Revalidate cache
  revalidateTag(CACHE_TAGS.patients);
  revalidateTag(`patient-${patientId}`);
  
  return NextResponse.json({ success: true });
}

// DELETE: Remove a patient from a doctor
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await context.params;
  if (!doctorId) return NextResponse.json({ error: "Missing doctorId" }, { status: 400 });
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  if (!patientId) return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
  await db.delete(doctorPatient).where(and(eq(doctorPatient.doctorId, doctorId), eq(doctorPatient.patientId, patientId)));
  
  // Revalidate cache
  revalidateTag(CACHE_TAGS.patients);
  revalidateTag(`patient-${patientId}`);
  
  return NextResponse.json({ success: true });
} 