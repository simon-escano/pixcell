"use client";

import { Profile, Role } from "@/db/schema";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Camera } from "lucide-react";

type CombinedUser = {
  id: User["id"];
  email: User["email"];
  phone: User["phone"];
  firstName: Profile["firstName"];
  lastName: Profile["lastName"];
  imageId: Profile["imageId"];
  imageUrl?: string;
  roleId: Role["id"];
  roleName: Role["name"];
};

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: CombinedUser;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    email: string;
    roleId: string;
    file?: File;
    password?: string;
  }) => Promise<void>;
  title: string;
  description: string;
  submitText: string;
  isAddMode?: boolean;
}

export function UserDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  title,
  description,
  submitText,
  isAddMode = false,
}: UserDialogProps) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [roleValue, setRoleValue] = useState<string>("");
  const [isPending, setIsPending] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    role?: string;
  }>({});

  useEffect(() => {
    if (user) {
      setRoleValue(user.roleId);
      setPreview(user.imageUrl || null);
    } else {
      setRoleValue("");
      setPreview(null);
    }
    // Clear form errors when dialog opens
    setFormErrors({});
  }, [user, open]);

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

  const validateForm = () => {
    const errors: typeof formErrors = {};
    const firstName = (document.getElementById("firstName") as HTMLInputElement)?.value;
    const lastName = (document.getElementById("lastName") as HTMLInputElement)?.value;
    const email = (document.getElementById("email") as HTMLInputElement)?.value;
    const password = isAddMode ? (document.getElementById("password") as HTMLInputElement)?.value : undefined;

    if (!firstName?.trim()) {
      errors.firstName = "First name is required";
    }
    if (!lastName?.trim()) {
      errors.lastName = "Last name is required";
    }
    if (!email?.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    if (isAddMode && !password?.trim()) {
      errors.password = "Password is required";
    }
    if (!roleValue) {
      errors.role = "Role is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const firstName = (document.getElementById("firstName") as HTMLInputElement)?.value;
    const lastName = (document.getElementById("lastName") as HTMLInputElement)?.value;
    const email = (document.getElementById("email") as HTMLInputElement)?.value;
    const password = isAddMode ? (document.getElementById("password") as HTMLInputElement)?.value : undefined;

    setIsPending(true);
    try {
      await onSubmit({
        firstName,
        lastName,
        email,
        roleId: roleValue,
        file: file || undefined,
        password,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative flex items-center justify-center">
            <Label htmlFor="file-upload">
              <div className="group relative cursor-pointer">
                <Avatar className="size-24">
                  <AvatarImage
                    src={preview || ""}
                    className="object-cover"
                  />
                  <AvatarFallback>
                    {user?.firstName?.[0] || ""}
                    {user?.lastName?.[0] || ""}
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
            <Label className="text-right">Name<span className="text-destructive">*</span></Label>
            <div className="col-span-3 flex gap-2">
              <div className="flex-1">
                <Input
                  id="firstName"
                  defaultValue={user?.firstName || ""}
                  className={formErrors.firstName ? "border-red-500" : ""}
                  placeholder="First Name"
                />
                {formErrors.firstName && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.firstName}</p>
                )}
              </div>
              <div className="flex-1">
                <Input
                  id="lastName"
                  defaultValue={user?.lastName || ""}
                  className={formErrors.lastName ? "border-red-500" : ""}
                  placeholder="Last Name"
                />
                {formErrors.lastName && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.lastName}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email<span className="text-destructive">*</span>
            </Label>
            <div className="col-span-3">
              <Input
                id="email"
                placeholder="e.g. someone@example.com"
                defaultValue={user?.email || ""}
                className={formErrors.email ? "border-red-500" : ""}
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
              )}
            </div>
          </div>

          {isAddMode && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password<span className="text-destructive">*</span>
              </Label>
              <div className="col-span-3">
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  className={formErrors.password ? "border-red-500" : ""}
                />
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role<span className="text-destructive">*</span>
            </Label>
            <div className="col-span-3">
              <Select
                value={roleValue}
                onValueChange={setRoleValue}
                name="role"
                required
              >
                <SelectTrigger className={`w-full ${formErrors.role ? "border-red-500" : ""}`}>
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
                  <SelectItem value="6c11f0e2-7936-467f-b13c-d0ad9f14c1b1" className="text-primary">
                    Administrator
                  </SelectItem>
                </SelectContent>
              </Select>
              {formErrors.role && (
                <p className="mt-1 text-sm text-red-500">{formErrors.role}</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : submitText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 