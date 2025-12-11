"use client";
import { useState } from "react";
import { UserDialog } from "./user-dialog";
import { Button } from "../ui/button";
import { Edit } from "lucide-react";
import { updateUser } from "@/actions/users";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function EditUserDialogTrigger({ user, profile, role, roleId, organizationId }: { user: any, profile: any, role: string, roleId?: string, organizationId?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleEditSubmit = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    roleId: string;
    file?: File;
  }) => {
    if (!organizationId) {
      toast.error("Organization ID is required to update user.");
      return;
    }
    try {
      const result = await updateUser(
        user.id,
        data.firstName,
        data.lastName,
        data.email,
        data.roleId,
        organizationId,
        undefined,
        data.file
      );
      
      if (result.success) {
        toast.success("User updated successfully.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update user.");
      }
    } catch (error) {
      toast.error("Failed to update user.");
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-card-foreground hover:bg-muted h-8 w-8 p-0"
        onClick={() => setOpen(true)}
        aria-label="Edit User"
      >
        <Edit className="h-3 w-3" />
      </Button>
      <UserDialog
        open={open}
        onOpenChange={setOpen}
        user={{
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: profile.firstName,
          lastName: profile.lastName,
          imageId: profile.imageId,
          imageUrl: profile.imageUrl,
          roleId: roleId || "",
          roleName: role,
        }}
        onSubmit={handleEditSubmit}
        title="Edit User"
        description="Make changes to a user's details here. Click save when you're done."
        submitText="Save changes"
      />
    </>
  );
} 