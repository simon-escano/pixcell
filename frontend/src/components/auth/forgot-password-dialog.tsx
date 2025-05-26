"use client";

import { useState } from "react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { resetPasswordAction } from "@/actions/users";
import toast from "react-hot-toast";

export function ForgotPasswordDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const { errorMessage } = await resetPasswordAction(formData);
      if (!errorMessage) {
        toast.success("Password reset email sent. Please check your inbox.");
        setIsOpen(false);
      } else {
        toast.error(errorMessage);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="px-0">
          Forgot your password?
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Enter your email address and we'll send you a link to reset your password.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <Input
            name="email"
            type="email"
            placeholder="Enter your email"
            required
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 