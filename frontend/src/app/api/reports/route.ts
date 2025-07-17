import { NextRequest, NextResponse } from 'next/server';

// In-memory store for demonstration (replace with DB in production)
const reports: any[] = [];
let nextId = 1;

// POST /api/reports - create a new report
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, patientId } = body;
    if (!title || !content || !patientId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    const reportId = String(nextId++);
    reports.push({ id: reportId, title, content, patientId });
    return NextResponse.json({ success: true, reportId });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}

// GET /api/reports - list all reports (optional, for testing)
export async function GET() {
  return NextResponse.json(reports);
}
