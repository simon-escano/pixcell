"use client";

import { deleteUser, updateUser } from "@/actions/users";
import { Profile, Role } from "@/db/schema";
import { User } from "@supabase/supabase-js";
import { Camera, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CustomAlertDialog } from "./custom-alert-dialog";
import { DataTable } from "./data-table";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { PhoneInput } from "./ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type CombinedUser = {
  id: User["id"];
  firstName: Profile["firstName"];
  lastName: Profile["lastName"];
  email: User["email"];
  roleName: Role["name"];
  phone: User["phone"];
  imageId: Profile["imageId"];
  imageUrl: string | null;
  roleId: Role["id"];
};

export const UsersTable = ({ users, organizationId }: { users: CombinedUser[], organizationId?: string }) => {
  const router = useRouter();
  const params = useParams();
  const orgId = organizationId || (params as any)?.organizationId || "";
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CombinedUser | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [roleValue, setRoleValue] = useState<string>("");

  useEffect(() => {
    if (selectedUser) {
      setRoleValue(selectedUser.roleId);
    }
  }, [selectedUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      toast.error("No user selected for editing.");
      return;
    }
    const firstName = (document.getElementById("firstName") as HTMLInputElement)
      ?.value;
    const lastName = (document.getElementById("lastName") as HTMLInputElement)
      ?.value;
    const email = (document.getElementById("email") as HTMLInputElement)?.value;
    const phone = (document.getElementById("phone") as HTMLInputElement)?.value;
    const roleId = roleValue;

    if (!firstName || !lastName || !email || !roleId) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      await updateUser(
        selectedUser.id,
        firstName,
        lastName,
        email,
        roleId,
        phone,
        file ?? undefined,
      );
      toast.success("User updated successfully.");
      setEditOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to update user.");
    }
  };

  const handleAddUser = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    roleId: string;
    file?: File;
  }) => {
    const { createUserWithAutoPasswordAction } = await import("@/actions/users");
    const formData = new FormData();
    formData.append("firstName", data.firstName);
    formData.append("lastName", data.lastName);
    formData.append("email", data.email);
    formData.append("roleId", data.roleId);
    formData.append("licenseNo", "");
    if (orgId) formData.append("organizationId", orgId);
    if (data.file) formData.append("file", data.file);

    const res = await createUserWithAutoPasswordAction(formData);
    if (!res.errorMessage) {
      toast.success("User added successfully. Password has been auto-generated and will be required to be changed on first login.");
      setEditOpen(false);
      router.refresh();
    } else {
      if (res.errorMessage.includes("already registered")) {
        toast.error("This email is already registered. Please use a different email address.");
      } else if (res.errorMessage.includes("password")) {
        toast.error("Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.");
      } else if (res.errorMessage.includes("email")) {
        toast.error("Please enter a valid email address.");
      } else {
        toast.error(`Failed to add user: ${res.errorMessage}`);
      }
    }
  };

  const actionItems = [
    {
      label: "Copy User ID",
      onClick: (user: CombinedUser) => {
        navigator.clipboard.writeText(user.id);
        toast.success("User ID copied to clipboard");
      },
    },
    {
      label: "Edit User",
      onClick: (user: CombinedUser) => {
        setSelectedUser(user);
        setEditOpen(true);
      },
    },
    {
      label: "Delete User",
      onClick: (user: CombinedUser) => {
        setSelectedUser(user);
        setDeleteOpen(true);
      },
      customRender: () => (
        <button className="text-red-500 hover:text-red-700">Delete User</button>
      ),
    },
  ];

  const [addOpen, setAddOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({ firstName: "", lastName: "", email: "", roleId: "", file: undefined as File | undefined });

  const addUserButton = (
    <Button className="ml-2" variant="default">
       <Plus />
      Add User
    </Button>
  );

  return (
    <div>
      <DataTable
        data={users}
        excludeColumns={["roleId", "id", "imageId", "imageUrl"]}
        defaultHiddenColumns={["phone"]}
        columnConfigs={[{ key: "imageId", maxWidth: 200 }]}
        actionItems={actionItems}
        onRowClick={(user: CombinedUser) => {
          router.push(`/organizations/${orgId}/members/${user.id}`)
        }}
        customHeaderContent={addUserButton}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to a user's details here. Click save when you're
              done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="relative flex items-center justify-center">
              <Label htmlFor="file-upload">
                <div className="group relative cursor-pointer">
                  <Avatar className="size-24">
                    <AvatarImage
                      src={preview || selectedUser?.imageUrl || ""}
                      className="object-cover"
                    />
                    <AvatarFallback>
                      {selectedUser?.firstName[0]}
                      {selectedUser?.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 rounded-full bg-black/0 transition-colors duration-200 group-hover:bg-black/40" />
                  <Camera className="absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Label>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Name</Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="firstName"
                  defaultValue={selectedUser?.firstName || ""}
                  className="flex-1"
                />
                <Input
                  id="lastName"
                  defaultValue={selectedUser?.lastName || ""}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                placeholder="e.g. someone@example.com"
                defaultValue={selectedUser?.email || ""}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <PhoneInput
                id="phone"
                defaultCountry="PH"
                className="col-span-3"
                value={selectedUser?.phone?.replace(/\s+/g, "")}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                value={roleValue}
                onValueChange={setRoleValue}
                name="role"
                required
              >
                <SelectTrigger className="col-span-3 w-full">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fa32e38f-6461-4707-92ba-a366df7b3379">
                    Pathologist
                  </SelectItem>
                  <SelectItem value="1c045053-afcd-4337-8437-087406be7a91">
                    Hematologist
                  </SelectItem>
                  <SelectItem value="d653129b-c014-4cc9-89e3-7cbf9fc91fbc">
                    Medical Technologist
                  </SelectItem>
                  <SelectItem
                    value="6c11f0e2-7936-467f-b13c-d0ad9f14c1b1"
                    className="text-primary"
                  >
                    Administrator
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" onClick={handleSubmit}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CustomAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Are you absolutely sure?"
        description={
          <>
            This action cannot be undone. This will permanently delete{" "}
            <span className="text-primary font-semibold">
              {selectedUser?.firstName} {selectedUser?.lastName}
            </span>{" "}
            and remove all their data from our system.
          </>
        }
        onConfirm={async () => {
          if (!selectedUser) return;
          const res = await deleteUser(selectedUser.id);
          if (res.success) {
            toast.success("User deleted");
            router.refresh();
          } else {
            toast.error(res.error || "Failed to delete user.");
          }
        }}
        confirmText="Continue"
        cancelText="Cancel"
      />
    </div>
  );
};
