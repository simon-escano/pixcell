import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getProfileByUserId } from "@/db/queries/select";
import { getOrganizationsByProfileId } from "@/db/queries/select";

export const metadata = {
  title: "PixCell",
};

export default async function Home() {
  // Redirect to organizations page which will handle the logic
  redirect("/organizations");
}