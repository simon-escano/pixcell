import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { report } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();
    const { id } = await params;
    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Missing report ID or status' }, { status: 400 });
    }
    console.log(id);
    // Update the report status
    await db.update(report)
      .set({ status })
      .where(eq(report.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update report status' }, { status: 500 });
  }
}
