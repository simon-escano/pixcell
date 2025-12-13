import { NextRequest, NextResponse } from "next/server";
import { 
  getOrganizationById, 
  getPatientById, 
  getSampleById, 
  getReportById,
  getProfileByUserId 
} from "@/db/queries/select";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const type = req.nextUrl.searchParams.get("type");

    if (!id || !type) {
      return NextResponse.json({ error: "Missing id or type" }, { status: 400 });
    }

    let name: string | null = null;

    switch (type) {
      case "organization":
        const org = await getOrganizationById(id);
        name = org?.name || null;
        break;
      
      case "patient":
        const patient = await getPatientById(id);
        if (patient) {
          name = `${patient.firstName} ${patient.lastName}`.trim();
        }
        break;
      
      case "sample":
        const sample = await getSampleById(id);
        name = sample?.sampleName || null;
        break;
      
      case "report":
        const report = await getReportById(id);
        name = report?.title || null;
        break;
      
      case "user":
        const profile = await getProfileByUserId(id);
        if (profile) {
          name = `${profile.firstName} ${profile.lastName}`.trim();
        }
        break;
      
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ name });
  } catch (error) {
    console.error("Error fetching breadcrumb name:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

