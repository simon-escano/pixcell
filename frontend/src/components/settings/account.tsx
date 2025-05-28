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
import { logoutAction } from "@/actions/users";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";



export function SettingsAccount() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const router = useRouter();
  const handleLogout = async () => {
    const toastId = toast.loading("Logging out...");
    await logoutAction();
    router.replace("/login");
    toast.dismiss(toastId);
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
                <Input type="password" placeholder="Enter current password" />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" placeholder="Enter new password" />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" placeholder="Confirm new password" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsChangingPassword(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
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
        <Button variant="outline">Logout from All Devices</Button>
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
          <LogOut />
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
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive">Delete Account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Delete Account
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove all associated data from our servers.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input type="password" placeholder="Enter your password" />
              </div>
              <div className="space-y-2">
                <Label>Type "DELETE" to confirm</Label>
                <Input placeholder='Type "DELETE"' />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button variant="destructive">Delete Account</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 