import { NextRequest, NextResponse } from "next/server";
import { getAllDoctors } from "@/db/queries/select";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    
    const doctors = await getAllDoctors(organizationId || undefined);
    // Only return id, firstName, lastName for dropdown
    const result = doctors.map((doc: any) => ({
      id: doc.id,
      firstName: doc.firstName,
      lastName: doc.lastName,
    }));
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch doctors" }, { status: 500 });
  }
} 