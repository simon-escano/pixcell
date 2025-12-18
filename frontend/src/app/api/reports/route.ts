import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from "@/db";
import { report } from "@/db/schema";
import { getAllReports } from "@/db/queries/select";
import { revalidatePath, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache';


// POST /api/reports - create a new report
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, patientId, sampleId, isAiGenerated, generatedBy, testType, status } = body;
    if (!title || !content || !patientId || !sampleId || !isAiGenerated || !generatedBy || !testType) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    await db.insert(report).values({
      title,
      content,
      patientId,
      sampleId,
      isAiGenerated,
      generatedBy,
      testType,
      status: status || "Draft",
      createdAt: new Date(),
    });

    // Revalidate cache
    revalidateTag(CACHE_TAGS.reports);
    revalidatePath('/organizations');
    revalidatePath('/reports');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}

// GET /api/reports - list all reports (optional, for testing)
export async function GET() {
  try {
    const reports = await getAllReports();
    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch reports' }, { status: 500 });
  }
}
