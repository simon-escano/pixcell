"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { changePasswordAction } from "@/actions/users";
import toast from "react-hot-toast";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
  onSuccess,
}: ChangePasswordDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = () => {
    const errors: typeof formErrors = {};
    const currentPassword = (document.getElementById("currentPassword") as HTMLInputElement)?.value;
    const newPassword = (document.getElementById("newPassword") as HTMLInputElement)?.value;
    const confirmPassword = (document.getElementById("confirmPassword") as HTMLInputElement)?.value;

    if (!currentPassword?.trim()) {
      errors.currentPassword = "Current password is required";
    }
    if (!newPassword?.trim()) {
      errors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters long";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword)) {
      errors.newPassword = "Password must contain uppercase, lowercase, number, and special character";
    }
    if (!confirmPassword?.trim()) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const currentPassword = (document.getElementById("currentPassword") as HTMLInputElement)?.value;
    const newPassword = (document.getElementById("newPassword") as HTMLInputElement)?.value;

    setIsPending(true);
    try {
      const res = await changePasswordAction(currentPassword, newPassword);
      if (!res.errorMessage) {
        toast.success("Password changed successfully");
        onSuccess();
        onOpenChange(false);
        // Clear form
        (document.getElementById("currentPassword") as HTMLInputElement).value = "";
        (document.getElementById("newPassword") as HTMLInputElement).value = "";
        (document.getElementById("confirmPassword") as HTMLInputElement).value = "";
        setFormErrors({});
      } else {
        toast.error(res.errorMessage);
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            You must change your password before continuing. Please enter your current password and choose a new one.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="currentPassword" className="text-right">
              Current Password<span className="text-destructive">*</span>
            </Label>
            <div className="col-span-3">
              <Input
                id="currentPassword"
                type="password"
                placeholder="Enter current password"
                className={formErrors.currentPassword ? "border-red-500" : ""}
              />
              {formErrors.currentPassword && (
                <p className="mt-1 text-sm text-red-500">{formErrors.currentPassword}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="newPassword" className="text-right">
              New Password<span className="text-destructive">*</span>
            </Label>
            <div className="col-span-3">
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                className={formErrors.newPassword ? "border-red-500" : ""}
              />
              {formErrors.newPassword && (
                <p className="mt-1 text-sm text-red-500">{formErrors.newPassword}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="confirmPassword" className="text-right">
              Confirm Password<span className="text-destructive">*</span>
            </Label>
            <div className="col-span-3">
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                className={formErrors.confirmPassword ? "border-red-500" : ""}
              />
              {formErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{formErrors.confirmPassword}</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Changing..." : "Change Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

