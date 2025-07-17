import { NextResponse } from 'next/server';

const patients = [
  { id: '1', firstName: 'John', lastName: 'Doe' },
  { id: '2', firstName: 'Jane', lastName: 'Smith' },
];

export async function GET() {
  return NextResponse.json(patients);
} 