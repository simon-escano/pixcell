"use client";

import { deleteUser } from "@/actions/users";
import { format } from "date-fns";
import { Plus, Upload } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useMemo, useState, useRef } from "react";
import toast from "react-hot-toast";
import { CustomAlertDialog } from "../custom-alert-dialog";
import NameEmailAvatar from "../name-email-avatar";
import SearchInput from "../search-input";
import SelectionBar from "../selection-bar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import FilterDropdown, { SortDirection } from "../filter-dropdown";
import { UserDialog } from "./user-dialog";
import Papa from "papaparse";

type CombinedUser = {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  imageId: string | null;
  imageUrl: string | null;
  roleId: string;
  roleName: string;
  updatedAt?: Date | string | null;
};

interface MembersListProps {
  users: CombinedUser[];
  organizationId: string;
  isAdmin?: boolean;
}

type SortField = "name" | "email" | "phone" | "role" | "date";

const MembersList = ({ users, organizationId, isAdmin = false }: MembersListProps) => {
  const router = useRouter();
  const params = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CombinedUser | null>(null);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [visibleFields, setVisibleFields] = useState({
    role: true,
    phone: true,
    date: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEditSubmit = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    roleId: string;
    file?: File;
  }) => {
    if (!selectedUser) return;
    const { updateUser } = await import("@/actions/users");
    await updateUser(
      selectedUser.id,
      data.firstName,
      data.lastName,
      data.email,
      data.roleId,
      organizationId,
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
    formData.append("licenseNo", "");
    formData.append("organizationId", organizationId);
    if (data.file) formData.append("file", data.file);

    const { createUserWithAutoPasswordAction } = await import("@/actions/users");
    const res = await createUserWithAutoPasswordAction(formData);
    if (!res.errorMessage) {
      toast.success("User added successfully. Password has been auto-generated and will be required to be changed on first login.");
      setAddOpen(false);
      router.refresh();
    } else {
      if (res.errorMessage.includes("already registered") || res.errorMessage.includes("already exists")) {
        toast.error("This email is already registered. Please use a different email address.");
      } else {
        toast.error(`Failed to add user: ${res.errorMessage}`);
      }
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter((user) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.toLowerCase().includes(searchLower) ||
        user.roleName?.toLowerCase().includes(searchLower) ||
        user.id?.toLowerCase().includes(searchLower)
      );
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case "email":
          comparison = (a.email || "").localeCompare(b.email || "");
          break;
        case "phone":
          comparison = (a.phone || "").localeCompare(b.phone || "");
          break;
        case "role":
          comparison = (a.roleName || "").localeCompare(b.roleName || "");
          break;
        case "date":
          comparison = new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
          break;
        default:
          return 0;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [users, searchQuery, sortField, sortDirection]);

  const handleRowClick = (e: React.MouseEvent, userId: string, index: number) => {
    const isShift = e.shiftKey;
    const isCtrl = e.ctrlKey || e.metaKey;

    if (isShift && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeIds = filteredAndSortedUsers.slice(start, end + 1).map((u) => u.id);
      
      if (isCtrl) {
        setSelectedIds((prev) => {
          const newIds = new Set([...prev, ...rangeIds]);
          return Array.from(newIds);
        });
      } else {
        setSelectedIds(rangeIds);
      }
      setLastSelectedIndex(index);
    } else if (isCtrl) {
      setSelectedIds((prev) => {
        if (prev.includes(userId)) {
          return prev.filter((id) => id !== userId);
        } else {
          return [...prev, userId];
        }
      });
      setLastSelectedIndex(index);
    } else {
      const target = e.target as HTMLElement;
      const isInteractive = 
        target.closest('button') ||
        target.closest('[role="button"]') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('[data-prevent-navigation]');
      
      if (!isInteractive) {
        router.push(`/organizations/${organizationId}/members/${userId}`);
      }
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent, userId: string, index: number) => {
    e.stopPropagation();
    
    const isShift = e.shiftKey;
    const isCtrl = e.ctrlKey || e.metaKey;

    if (isShift && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeIds = filteredAndSortedUsers.slice(start, end + 1).map((u) => u.id);
      
      if (isCtrl) {
        setSelectedIds((prev) => {
          const newIds = new Set([...prev, ...rangeIds]);
          return Array.from(newIds);
        });
      } else {
        setSelectedIds(rangeIds);
      }
      setLastSelectedIndex(index);
    } else if (isCtrl) {
      setSelectedIds((prev) => {
        if (prev.includes(userId)) {
          return prev.filter((id) => id !== userId);
        } else {
          return [...prev, userId];
        }
      });
      setLastSelectedIndex(index);
    } else {
      setSelectedIds((prev) => {
        if (prev.includes(userId)) {
          return prev.filter((id) => id !== userId);
        } else {
          return [...prev, userId];
        }
      });
      setLastSelectedIndex(index);
    }
  };

  const handleBulkDelete = async () => {
    const failed: { id: string; error: string }[] = [];
    for (const id of selectedIds) {
      const res = await deleteUser(id);
      if (!res.success) {
        failed.push({ id, error: res.error || 'Unknown error' });
      }
    }
    if (failed.length > 0) {
      toast.error(failed.map(f => `ID: ${f.id} - ${f.error}`).join('\n'));
    } else {
      toast.success("Selected users deleted.");
    }
    setSelectedIds([]);
    setBatchDeleteOpen(false);
    router.refresh();
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
          const response = await fetch("/api/members/batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              users: results.data,
              organizationId: organizationId,
            }),
          });
          const result = await response.json();
          if (response.ok) {
            toast.success("Users imported successfully.");
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

  return (
    <div className="relative h-full overflow-y-auto">
      {/* Header */}
      <div className="flex gap-2 justify-between px-6 py-2 border-b items-center sticky top-0 bg-background z-10">
        <div className="flex-1 flex gap-2 items-center h-full">
          <SearchInput
            placeholder="Search members..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <div className="flex gap-2">
          <FilterDropdown
            sortFields={[
              { value: "name", label: "Name" },
              { value: "email", label: "Email" },
              { value: "phone", label: "Phone" },
              { value: "role", label: "Role" },
              { value: "date", label: "Date" },
            ]}
            sortField={sortField}
            onSortFieldChange={(field) => setSortField(field as SortField)}
            sortDirection={sortDirection}
            onSortDirectionChange={setSortDirection}
            displayProperties={[
              { value: "role", label: "Role" },
              { value: "phone", label: "Phone" },
              { value: "date", label: "Date" },
            ]}
            visibleFields={visibleFields}
            onVisibleFieldsChange={(fields) => {
              setVisibleFields({
                role: fields.role ?? visibleFields.role,
                phone: fields.phone ?? visibleFields.phone,
                date: fields.date ?? visibleFields.date,
              });
            }}
          />
          {isAdmin && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default">
                    <Plus />
                    Add User
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setAddOpen(true)}>
                    <Plus className="size-4" />
                    Add Manually
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleImportClick}>
                    <Upload className="size-4" />
                    Import via CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="relative">
        <table className="w-full">
          <thead className="border-b">
            <tr>
              {isAdmin && <th className="text-left text-xs font-normal w-12"></th>}
              <th className={`text-left text-xs py-2 font-normal text-muted-foreground ${isAdmin ? 'pr-6' : 'pl-11 pr-6'}`}>Member</th>
              {visibleFields.role && <th className="text-left text-xs font-normal text-muted-foreground pr-6">Role</th>}
              {visibleFields.phone && <th className="text-left text-xs font-normal text-muted-foreground pr-6">Phone</th>}
              {visibleFields.date && <th className="text-left text-xs font-normal text-muted-foreground pr-6">Joined</th>}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedUsers.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="text-center text-muted-foreground py-8">
                  No members found
                </td>
              </tr>
            ) : (
              filteredAndSortedUsers.map((user, index) => {
                const date = user.updatedAt ? format(new Date(user.updatedAt), "MMM d") : null;
                return (
                  <tr
                    key={user.id}
                    className="group hover:bg-accent/50 cursor-pointer transition-colors h-[50px]"
                    onClick={(e) => handleRowClick(e, user.id, index)}
                  >
                    {isAdmin && (
                      <td>
                        <div className={`px-4 flex items-center justify-center transition-opacity pointer-events-none group-hover:pointer-events-auto ${selectedIds.includes(user.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          <Checkbox
                            checked={selectedIds.includes(user.id)}
                            onClick={(e) => handleCheckboxClick(e, user.id, index)}
                          />
                        </div>
                      </td>
                    )}
                    <td className={`${isAdmin ? 'pr-6' : 'pl-11 pr-6'}`}>
                      <NameEmailAvatar
                        imageUrl={user.imageUrl}
                        firstName={user.firstName}
                        lastName={user.lastName}
                        email={user.email}
                        onClick={() => router.push(`/organizations/${organizationId}/members/${user.id}`)}
                      />
                    </td>
                    {visibleFields.role && (
                      <td className="pr-6">
                        <Badge variant="outline" className="border-dashed text-[10px]">
                          {user.roleName}
                        </Badge>
                      </td>
                    )}
                    {visibleFields.phone && (
                      <td className="pr-6 text-sm">{user.phone || "-"}</td>
                    )}
                    {visibleFields.date && (
                      <td className="pr-6 text-sm text-muted-foreground">{date || "-"}</td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Dialogs */}
      <UserDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={selectedUser ? {
          ...selectedUser,
          imageUrl: selectedUser.imageUrl || undefined,
        } : undefined}
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
        onConfirm={handleBulkDelete}
        confirmText="Continue"
        cancelText="Cancel"
      />
      {isAdmin && (
        <SelectionBar
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          onDelete={() => setBatchDeleteOpen(true)}
          deleteLabel="Delete"
          onEdit={() => {
            if (selectedIds.length === 1) {
              const user = filteredAndSortedUsers.find(u => u.id === selectedIds[0]);
              if (user) {
                setSelectedUser(user);
                setEditOpen(true);
              }
            }
          }}
          editLabel="Edit"
        />
      )}
    </div>
  );
};

export default MembersList;

