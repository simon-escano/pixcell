import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db"; // adjust import as needed
import { user, profile, role, organizationStaff } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { users, organizationId } = body;
    
    if (!Array.isArray(users)) {
      return NextResponse.json({ message: "Invalid data format" }, { status: 400 });
    }
    
    if (!organizationId) {
      return NextResponse.json({ message: "Organization ID is required" }, { status: 400 });
    }
    // Parallelize email existence checks
    const emailChecks = await Promise.all(
      users.map(u => 
        db.select().from(user).where(eq(user.email, u.email)).limit(1)
      )
    );
    const existingEmails = new Set(
      emailChecks
        .map((result, index) => result.length > 0 ? users[index].email : null)
        .filter(Boolean) as string[]
    );

    const results = [];
    for (const u of users) {
      // Validate required fields
      if (!u.firstName || !u.lastName || !u.email || !u.roleId) {
        results.push({ email: u.email, success: false, error: "Missing required fields" });
        continue;
      }
      // Check if email already exists (from parallel check)
      if (existingEmails.has(u.email)) {
        results.push({ email: u.email, success: false, error: "Email already exists" });
        continue;
      }
      try {
        // Create user
        const userId = uuidv4();
        await db.insert(user).values({
          id: userId,
          email: u.email,
          phone: u.phone || null,
        });
        // Create profile (without roleId)
        const profileId = uuidv4();
        await db.insert(profile).values({
          id: profileId,
          firstName: u.firstName,
          lastName: u.lastName,
          userId: userId,
          imageId: u.imageId || null,
        });
        // Create organizationStaff entry to link user to organization with roleId
        await db.insert(organizationStaff).values({
          organizationId,
          staffId: profileId,
          roleId: u.roleId,
        });
        results.push({ email: u.email, success: true });
      } catch (err: any) {
        results.push({ email: u.email, success: false, error: err.message });
      }
    }

    // Revalidate cache if any users were created
    if (results.some(r => r.success)) {
      revalidateTag(CACHE_TAGS.users);
      revalidateTag(CACHE_TAGS.profiles);
      revalidatePath('/organizations');
    }

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Server error" }, { status: 500 });
  }
} 