"use client";

import { deleteUser, updateUser } from "@/actions/users";
import { Profile, Role } from "@/db/schema";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import React, { useRef, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { CustomAlertDialog } from "./custom-alert-dialog";
import { DataTable } from "./data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Camera } from "lucide-react";
import { PhoneInput } from "./ui/phone-input";

type CombinedUser = {
  id: User["id"];
  email: User["email"];
  phone: User["phone"];
  firstName: Profile["firstName"];
  lastName: Profile["lastName"];
  imageUrl: Profile["imageUrl"];
  roleId: Role["id"];
  roleName: Role["name"];
};

export const UsersTable = ({ users }: { users: CombinedUser[] }) => {
  const router = useRouter();
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

  return (
    <div>
      <DataTable
        data={users}
        excludeColumns={["roleId"]}
        columnConfigs={[{ key: "imageUrl", maxWidth: 200 }]}
        actionItems={actionItems}
        onRowClick={(user: CombinedUser) => {
          router.push(`/users/${user.id}`);
        }}
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
                  <SelectItem value="41ae0f54-b306-4ae2-9bb6-c33776fae906">
                    Pathologist
                  </SelectItem>
                  <SelectItem value="7e12a5bb-597c-4d69-8e2e-90666c08d6f7">
                    Hematologist
                  </SelectItem>
                  <SelectItem value="f080882b-2922-42a3-800b-50a65e2c4822">
                    Medical Technologist
                  </SelectItem>
                  <SelectItem
                    value="c404ee51-8979-48d9-bf24-38d071dd6b37"
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
