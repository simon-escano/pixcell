import { getUser } from "@/lib/auth";
import { getUserMetaByUserId } from "../../../queries";

export async function getCurrentUser() {
  const user = await getUser();
  const profile = await getUserMetaByUserId(user.id);
  return profile;
}