import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { doctorPatient, profile, image, role } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAllDoctors } from "@/db/queries/select";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

// GET: List all assigned doctors for a patient
export async function GET(
  req: NextRequest,
  context: { params: { patientId: string } }
) {
  const { patientId } = context.params;
  if (!patientId) return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
  
  // Parallelize: get assignments and all doctors simultaneously
  const [assignments, allDoctors] = await Promise.all([
    db
      .select({ doctorId: doctorPatient.doctorId })
      .from(doctorPatient)
      .where(eq(doctorPatient.patientId, patientId)),
    getAllDoctors()
  ]);
  
  const assignedDoctorIds = assignments.map((a) => a.doctorId);
  const assignedDoctors = allDoctors.filter((doc: any) => assignedDoctorIds.includes(doc.id));
  
  return NextResponse.json(assignedDoctors.map((doc: any) => ({ id: doc.id, firstName: doc.firstName, lastName: doc.lastName })));
}

// POST: Assign a doctor to a patient
export async function POST(
  req: NextRequest,
  context: { params: { patientId: string } }
) {
  const { patientId } = context.params;
  if (!patientId) return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
  const { doctorId } = await req.json();
  if (!doctorId) return NextResponse.json({ error: "Missing doctorId" }, { status: 400 });
  // Insert assignment if not exists
  await db.insert(doctorPatient).values({ doctorId, patientId });
  
  // Revalidate cache
  revalidateTag(CACHE_TAGS.patients);
  revalidateTag(`patient-${patientId}`);
  
  return NextResponse.json({ success: true });
}

// DELETE: Remove a doctor from a patient
export async function DELETE(
  req: NextRequest,
  context: { params: { patientId: string } }
) {
  const { patientId } = context.params;
  if (!patientId) return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId");
  if (!doctorId) return NextResponse.json({ error: "Missing doctorId" }, { status: 400 });
  await db.delete(doctorPatient).where(and(eq(doctorPatient.patientId, patientId), eq(doctorPatient.doctorId, doctorId)));
  
  // Revalidate cache
  revalidateTag(CACHE_TAGS.patients);
  revalidateTag(`patient-${patientId}`);
  
  return NextResponse.json({ success: true });
} 