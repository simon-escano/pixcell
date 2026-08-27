import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getUserMetaByUserId } from "../../../queries";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore as any });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const profile = await getUserMetaByUserId(user.id);
    return profile || null;
  } catch {
    return null;
  }
}