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
import { setupInitialPasswordAction } from "@/actions/users";
import toast from "react-hot-toast";

interface SetupPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  email: string;
}

export function SetupPasswordDialog({
  open,
  onOpenChange,
  onSuccess,
  email,
}: SetupPasswordDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = () => {
    const errors: typeof formErrors = {};
    const newPassword = (document.getElementById("newPassword") as HTMLInputElement)?.value;
    const confirmPassword = (document.getElementById("confirmPassword") as HTMLInputElement)?.value;

    if (!newPassword?.trim()) {
      errors.newPassword = "Password is required";
    } else if (newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters long";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword)) {
      errors.newPassword = "Password must contain uppercase, lowercase, number, and special character";
    }
    if (!confirmPassword?.trim()) {
      errors.confirmPassword = "Please confirm your password";
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

    const newPassword = (document.getElementById("newPassword") as HTMLInputElement)?.value;

    setIsPending(true);
    try {
      const res = await setupInitialPasswordAction(email, newPassword);
      if (!res.errorMessage) {
        if (res.requiresEmailVerification) {
          toast.success(res.message || "Password reset link sent to your email");
          onSuccess();
          onOpenChange(false);
        } else {
          toast.success("Password set up successfully");
          onSuccess();
          onOpenChange(false);
        }
        // Clear form
        (document.getElementById("newPassword") as HTMLInputElement).value = "";
        (document.getElementById("confirmPassword") as HTMLInputElement).value = "";
        setFormErrors({});
      } else {
        toast.error(res.errorMessage);
      }
    } catch (error) {
      console.error("Error setting up password:", error);
      toast.error("Failed to set up password");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Up Your Password</DialogTitle>
          <DialogDescription>
            Please create a secure password for your account. This will be your login password.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
            {isPending ? "Setting up..." : "Set Up Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
