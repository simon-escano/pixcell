"use client";

import { deleteUser, updateUser, createUserWithAutoPasswordAction } from "@/actions/users";
import { Profile, Role } from "@/db/schema";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { CustomAlertDialog } from "../custom-alert-dialog";
import { DataTable } from "../data-table";
import { Button } from "../ui/button";
import { UserDialog } from "./user-dialog";
import { CirclePlus, Upload, XCircle } from "lucide-react";
// @ts-ignore: If types are missing for papaparse
import Papa from "papaparse";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";

type CombinedUser = {
  id: User["id"];
  email: User["email"];
  phone: User["phone"];
  firstName: Profile["firstName"];
  lastName: Profile["lastName"];
  imageId: Profile["imageId"];
  roleId: Role["id"];
  roleName: Role["name"];
};

function ImportErrorToast({ title, failed }: { title: string; failed: any[] }) {
  return (
    <div className="flex items-start gap-3 bg-red-50 shadow-lg rounded-md p-4 border-l-4 border-red-400">
      <XCircle className="text-red-500 w-6 h-6 mt-1 flex-shrink-0" />
      <div>
        <div className="font-semibold text-red-700 mb-2">{title}</div>
        <ul className="pl-4 list-disc space-y-1">
          {failed.map((f, i) => (
            <li key={i}>
              <span className="font-medium">{f.email}</span>
              <span className="text-red-600 font-normal">: {f.error}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export const UsersTable = ({ users }: { users: CombinedUser[] }) => {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CombinedUser | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

  const handleEditSubmit = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    roleId: string;
    file?: File;
  }) => {
    if (!selectedUser) return;
    await updateUser(
      selectedUser.id,
      data.firstName,
      data.lastName,
      data.email,
      data.roleId,
      undefined,
      data.file
    );
    toast.success("User updated successfully.");
    setEditOpen(false);
    router.refresh();
  };

  const handleAddSubmit = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    roleId: string;
    file?: File;
  }) => {
    const formData = new FormData();
    formData.append("firstName", data.firstName);
    formData.append("lastName", data.lastName);
    formData.append("email", data.email);
    formData.append("roleId", data.roleId);
    formData.append("licenseNo", ""); // Add empty license number for now
    if (data.file) formData.append("file", data.file);

    const res = await createUserWithAutoPasswordAction(formData);
    if (!res.errorMessage) {
      toast.success("User added successfully. Password has been auto-generated and will be required to be changed on first login.");
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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: Papa.ParseResult<any>) => {
        try {
          const response = await fetch("/api/users/batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(results.data),
          });
          const result = await response.json();
          if (response.ok) {
            const failed = result.results?.filter((r: any) => !r.success) || [];
            if (failed.length > 0) {
              toast.custom(
                <ImportErrorToast
                  title="Some users were not imported:"
                  failed={failed}
                />, { duration: 2000 }
              );
            } else {
              toast.success("Users imported successfully.");
            }
            router.refresh();
          } else {
            toast.error(result.message || "Failed to import users.");
          }
        } catch (err) {
          toast.error("Error importing users.");
        }
      },
      error: () => {
        toast.error("Failed to parse CSV file.");
      },
    });
    e.target.value = "";
  };

  const handleAddManual = () => {
    setAddOpen(true);
  };

  const addUserDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="ml-2" variant="default">
          <CirclePlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleAddManual}>
          <CirclePlus className="mr-2 h-4 w-4" />
          Add Manually
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleImportClick}>
          <Upload className="mr-2 h-4 w-4" />
          Import via CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

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
        data={[...users].sort((a, b) => a.firstName.localeCompare(b.firstName))}
        excludeColumns={["roleId", "id", "imageId", "imageUrl"]}
        defaultHiddenColumns={["phone"]}
        columnConfigs={[{ key: "imageId", maxWidth: 200 }]}
        actionItems={actionItems}
        onRowClick={(user: CombinedUser) => {
          router.push(`/users/${user.id}`);
        }}
        customHeaderContent={
          <div className="flex items-center gap-2">
            {addUserDropdown}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        }
        selectedRowIds={selectedIds}
        onSelectedRowIdsChange={setSelectedIds}
        getRowId={row => row.id}
      />
      {selectedIds.length > 0 && (
        <div className="flex justify-start mt-4">
          <Button
            variant="destructive"
            onClick={() => setBatchDeleteOpen(true)}
          >
            Delete Selected ({selectedIds.length})
          </Button>
        </div>
      )}

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
      <CustomAlertDialog
        open={batchDeleteOpen}
        onOpenChange={setBatchDeleteOpen}
        title="Are you absolutely sure?"
        description={
          <>
            This action cannot be undone. This will permanently delete {selectedIds.length} users and remove all their data from our system.
          </>
        }
        onConfirm={async () => {
          const failed: { id: string, error: string }[] = [];
          for (const id of selectedIds) {
            const res = await deleteUser(id);
            if (!res.success) {
              failed.push({ id, error: res.error || 'Unknown error' });
            }
          }
          if (failed.length > 0) {
            toast.error(
              failed.map(f => `ID: ${f.id} - ${f.error}`).join('\n')
            );
          } else {
            toast.success("Selected users deleted.");
          }
          setSelectedIds([]);
          setBatchDeleteOpen(false);
          router.refresh();
        }}
        confirmText="Continue"
        cancelText="Cancel"
      />
    </div>
  );
};
