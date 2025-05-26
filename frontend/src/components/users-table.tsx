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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  FilterFn,
  ColumnDef,
} from "@tanstack/react-table";

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

export const UsersTable = ({
  users,
  roles,
}: { users: CombinedUser[]; roles: Role[] }) => {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CombinedUser | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [roleValue, setRoleValue] = useState<string>("");
  const [rowSelection, setRowSelection] = React.useState({});

  useEffect(() => {
    if (selectedUser) {
      setRoleValue(selectedUser.roleId);
      setPreview(selectedUser.imageUrl);
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

  const columns: ColumnDef<CombinedUser>[] = [
    {
      accessorKey: "lastName",
      header: "Last Name",
    },
    {
      accessorKey: "firstName",
      header: "First Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "roleName",
      header: "Role",
    },
    {
      accessorKey: "id",
      header: "ID",
      enableHiding: true,
    },
    {
      accessorKey: "imageUrl",
      header: "Image",
      enableHiding: true,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }: { row: { original: CombinedUser } }) => {
        const user = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                Copy User ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                setSelectedUser(user);
                setEditOpen(true);
              }}>
                Edit user
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-500" onClick={() => {
                setSelectedUser(user);
                setDeleteOpen(true);
              }}>
                Delete user
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div>
      <DataTable
        data={users}
        customColumns={columns}
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
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
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
