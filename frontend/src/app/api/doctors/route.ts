import { NextResponse } from 'next/server';
import { getAllDoctors } from '@/db/queries/select';

export async function GET() {
  try {
    const doctors = await getAllDoctors();
    return NextResponse.json(doctors);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch doctors.' }, { status: 500 });
  }
} 