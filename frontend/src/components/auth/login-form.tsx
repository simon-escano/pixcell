"use client";

import { cn } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { checkAccountExistsAction } from "@/actions/users";
import toast from "react-hot-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ForgotPasswordDialog } from "./forgot-password-dialog";
import { ChangePasswordDialog } from "./change-password-dialog";
import { SetupPasswordDialog } from "./setup-password-dialog";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<'email' | 'password' | 'change-password'>('email');
  const [email, setEmail] = useState('');
  const [accountInfo, setAccountInfo] = useState<{
    exists: boolean;
    mustChangePassword: boolean;
    errorMessage: string | null;
  } | null>(null);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [showSetupPasswordDialog, setShowSetupPasswordDialog] = useState(false);

  const handleCheckAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    startTransition(async () => {
      const result = await checkAccountExistsAction(email);
      setAccountInfo(result);
      
      if (result.exists) {
        if (result.mustChangePassword) {
          setStep('change-password');
          setShowSetupPasswordDialog(true);
        } else {
          setStep('password');
        }
      } else {
        toast.error(result.errorMessage || "Account not found");
      }
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const password = formData.get("password") as string;
    const supabase = createClientComponentClient();

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) {
        toast.success("Successfully logged in");
        router.replace("/");
      } else {
        toast.error(error.message);
      }
    });
  };

  const handlePasswordChangeSuccess = () => {
    setShowChangePasswordDialog(false);
    toast.success("Password changed successfully. You can now log in.");
    setStep('password');
  };

  const handleSetupPasswordSuccess = () => {
    setShowSetupPasswordDialog(false);
    toast.success("Password set up successfully. You can now log in.");
    setStep('password');
  };

  const handleBackToEmail = () => {
    setStep('email');
    setEmail('');
    setAccountInfo(null);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back to PixCell!</CardTitle>
          <CardDescription>
            Dive back into your collaborative workspace for microscopic
            diagnostics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' && (
            <form onSubmit={handleCheckAccount}>
              <div className="grid gap-6">
                <div className="grid gap-4">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Button type="submit" className="w-full cursor-pointer" disabled={isPending}>
                      {isPending ? "Checking..." : "Check Account"}
                    </Button>
                  </div>
                </div>
                <div className="text-center text-sm">
                  Are you a patient?{" "}
                  <Link href="/reports/view" className="underline underline-offset-4 text-primary">
                    View reports
                  </Link>
                </div>
              </div>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleLogin}>
              <div className="grid gap-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Account found for <strong>{email}</strong>
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToEmail}
                    className="mt-2"
                  >
                    ← Use different email
                  </Button>
                </div>
                <div className="flex flex-col gap-4">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Button type="submit" className="w-full cursor-pointer" disabled={isPending}>
                      {isPending ? "Signing in..." : "Sign In"}
                    </Button>
                    <ForgotPasswordDialog />
                  </div>
                </div>
              </div>
            </form>
          )}

          {step === 'change-password' && (
            <div className="grid gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Account found for <strong>{email}</strong>
                </p>
                <p className="text-sm text-amber-600 mt-2">
                  You need to set up your password before continuing.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToEmail}
                  className="mt-2"
                >
                  ← Use different email
                </Button>
              </div>
              <div className="text-center">
                <Button
                  type="button"
                  onClick={() => setShowSetupPasswordDialog(true)}
                  className="w-full"
                >
                  Set Up Password
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <ChangePasswordDialog
        open={showChangePasswordDialog}
        onOpenChange={setShowChangePasswordDialog}
        onSuccess={handlePasswordChangeSuccess}
      />
      
      <SetupPasswordDialog
        open={showSetupPasswordDialog}
        onOpenChange={setShowSetupPasswordDialog}
        onSuccess={handleSetupPasswordSuccess}
        email={email}
      />
      
      <div className="text-muted-foreground [&_a]:hover:text-primary text-center text-xs text-balance [&_a]:underline [&_a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
