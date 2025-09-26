"use client";

import { useState, useEffect } from "react";
import { ChangePasswordDialog } from "./change-password-dialog";
import { useRouter } from "next/navigation";

interface PasswordChangeWrapperProps {
  children: React.ReactNode;
  mustChangePassword: boolean;
}

export function PasswordChangeWrapper({
  children,
  mustChangePassword,
}: PasswordChangeWrapperProps) {
  const [showDialog, setShowDialog] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (mustChangePassword) {
      setShowDialog(true);
    }
  }, [mustChangePassword]);

  const handlePasswordChangeSuccess = () => {
    setShowDialog(false);
    router.refresh(); // Refresh to get updated user data
  };

  if (mustChangePassword) {
    return (
      <>
        <ChangePasswordDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          onSuccess={handlePasswordChangeSuccess}
        />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Password Change Required</h2>
            <p className="text-muted-foreground">
              Please change your password to continue.
            </p>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
}

