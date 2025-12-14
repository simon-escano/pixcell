import { redirect } from "next/navigation";

export const metadata = {
  title: "PixCell | Dashboard",
};

export default async function Page({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const paramsObj = await params;
  const organizationId = paramsObj.organizationId;
  
  // Redirect to organization page (which now includes dashboard content)
  redirect(`/organizations/${organizationId}`);
}
