import { getProfileByUserId, getRoleByUserIdAndOrganizationId } from "@/db/queries/select";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, organizationId } = req.query;
  if (!userId || typeof userId !== "string") return res.status(400).json({ error: "Missing userId" });

  const profile = await getProfileByUserId(userId);
  let role = null;
  if (profile && organizationId && typeof organizationId === "string") {
    role = await getRoleByUserIdAndOrganizationId(userId, organizationId);
  }
  res.status(200).json({ profile, role });
} 