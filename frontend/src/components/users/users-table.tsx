"use client";

import { deleteUser, updateUser, createUserAction } from "@/actions/users";
import { Profile, Role } from "@/db/schema";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { CustomAlertDialog } from "../custom-alert-dialog";
import { DataTable } from "../data-table";
import { Button } from "../ui/button";
import { UserDialog } from "./user-dialog";
import { Plus } from "lucide-react";

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
  const [addOpen, setAddOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CombinedUser | null>(null);

  const handleEditSubmit = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    roleId: string;
    phone?: string;
    file?: File;
  }) => {
    if (!selectedUser) return;
    await updateUser(
      selectedUser.id,
      data.firstName,
      data.lastName,
      data.email,
      data.roleId,
      data.phone,
      data.file
    );
    toast.success("User updated successfully.");
  };

  const handleAddSubmit = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    roleId: string;
    phone?: string;
    file?: File;
    password?: string;
  }) => {
    if (!data.password) {
      toast.error("Password is required");
      return;
    }

    const formData = new FormData();
    formData.append("firstName", data.firstName);
    formData.append("lastName", data.lastName);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("roleId", data.roleId);
    if (data.phone) formData.append("phone", data.phone);
    if (data.file) formData.append("file", data.file);

    const res = await createUserAction(formData);
    if (!res.errorMessage) {
      toast.success("User added successfully.");
      setAddOpen(false);
      router.refresh();
    } else {
      // Handle specific error cases
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

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 size-4" />
          Add User
        </Button>
      </div>

      <DataTable
        data={users}
        excludeColumns={["roleId"]}
        columnConfigs={[{ key: "imageUrl", maxWidth: 200 }]}
        actionItems={actionItems}
        onRowClick={(user: CombinedUser) => {
          router.push(`/users/${user.id}`);
        }}
      />

      <UserDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={selectedUser || undefined}
        onSubmit={handleEditSubmit}
        title="Edit User"
        description="Make changes to a user's details here. Click save when you're done."
        submitText="Save changes"
      />

      <UserDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAddSubmit}
        title="Add User"
        description="Fill in the details to create a new user account."
        submitText="Create User"
        isAddMode={true}
      />

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
