import Base from "@/components/base";
import { Dashboard } from "@/components/dashboard";
import { getUser } from "@/lib/auth";
import { getProfileByUserId, getRoleById } from "@/db/queries/select";

export default async function Page() {
  const user = await getUser();
  let userProfile = null;

  if (user && user.email) {
    const profile = await getProfileByUserId(user.id);
    const role = await getRoleById(profile.roleId);

    userProfile = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: user.email,
      phone: user.phone || null,
      imageUrl: profile.imageUrl,
      role: role.name
    };
  }

  return (
    <Base>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Dashboard userProfile={userProfile} />
      </div>
    </Base>
  );
}