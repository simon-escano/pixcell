import { getUserMetaByUserId } from "@/app/samples/queries";
import { getUser } from "@/lib/auth";

export async function getCurrentUser() {
  const user = await getUser();
  const profile = await getUserMetaByUserId(user.id);
  return profile;
}