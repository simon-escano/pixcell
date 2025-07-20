import { NextRequest, NextResponse } from "next/server";
import { getReportByCode, getPatientById, getSampleById, getProfileByUserId, getRoleById } from "@/db/queries/select";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }
  // Fetch report by code
  const report = await getReportByCode(code);
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  // Fetch related data for preview
  const patient = report.patientId ? await getPatientById(report.patientId) : null;
  const sample = report.sampleId ? await getSampleById(report.sampleId) : null;
  let doctor = null, role = null;
  if (sample?.createdBy) {
    doctor = await getProfileByUserId(sample.createdBy);
    if (doctor?.roleId) role = await getRoleById(doctor.roleId);
  }
  const contentObj = (typeof report.content === "object" && report.content !== null)
    ? report.content as any
    : { text: "", tables: [] };
  const formData = {
    title: report.title || "",
    testType: report.testType || "",
    content: typeof contentObj.text === "string" ? contentObj.text : "",
    isAiGenerated: report.isAiGenerated || false,
  };
  const reportContent = {
    text: typeof contentObj.text === "string" ? contentObj.text : "",
    tables: Array.isArray(contentObj.tables) ? contentObj.tables : [],
  };
  const doctorName = doctor ? `${doctor.firstName} ${doctor.lastName}` : "N/A";
  const doctorRole = role && role.id && role.name ? role : { id: 'unknown', name: 'Doctor' };
  const doctorLicense = (doctor && 'licenseNo' in doctor && (doctor as any).licenseNo) ? (doctor as any).licenseNo : "N/A";
  return NextResponse.json({
    formData,
    reportContent,
    selectedPatient: patient ?? undefined,
    selectedSample: sample ? { ...sample, createdByName: doctorName } : undefined,
    doctorName,
    doctorRole,
    doctorLicense,
  });
} 