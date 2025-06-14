"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, LogOut } from "lucide-react";
import { logoutAction, logoutAllDevicesAction, changePasswordAction } from "@/actions/users";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SettingsAccount() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const router = useRouter();
  const handleLogout = async () => {
    const toastId = toast.loading("Logging out...");
    await logoutAction();
    router.replace("/login");
    toast.dismiss(toastId);
  };

  const handleLogoutAllDevices = async () => {
    const toastId = toast.loading("Logging out from all devices...");
    const { errorMessage } = await logoutAllDevicesAction();
    if (errorMessage) {
      toast.error(errorMessage);
    } else {
      router.replace("/login");
      toast.success("Successfully logged out from all devices");
    }
    toast.dismiss(toastId);
  };

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Changing password...");

    try {
      const { errorMessage } = await changePasswordAction(
        formData.currentPassword,
        formData.newPassword
      );

      if (errorMessage) {
        toast.error(errorMessage);
      } else {
        toast.success("Password changed successfully");
        setIsChangingPassword(false);
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      toast.error("Failed to change password");
    } finally {
      setIsSubmitting(false);
      toast.dismiss(toastId);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Change Password Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Password</Label>
          <p className="text-sm text-muted-foreground">
            Change your account password
          </p>
        </div>
        <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
          <DialogTrigger asChild>
            <Button variant="outline">Change Password</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter your current password and a new password below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input 
                  type="password" 
                  placeholder="Enter current password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    currentPassword: e.target.value
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input 
                  type="password" 
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    newPassword: e.target.value
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input 
                  type="password" 
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    confirmPassword: e.target.value
                  }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsChangingPassword(false);
                  setFormData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePasswordChange}
                disabled={isSubmitting || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Logout from All Devices */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Active Sessions</Label>
          <p className="text-sm text-muted-foreground">
            Manage your active sessions across all devices
          </p>
        </div>
        <Button variant="outline" onClick={handleLogoutAllDevices}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout from All Devices
        </Button>
      </div>

      {/* Logout from Current Device */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Current Session</Label>
          <p className="text-sm text-muted-foreground">
            Log out from your current device
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Delete Account */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="text-destructive">Danger Zone</Label>
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated data
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button variant="destructive" disabled>Delete Account</Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Please contact a system administrator to delete your account.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
} 