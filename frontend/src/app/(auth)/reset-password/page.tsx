"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/client";
import toast from "react-hot-toast";
import { Worm } from "lucide-react";
import Link from "next/link";
import { validatePassword } from "@/utils/password";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isValidLink, setIsValidLink] = useState(false);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    // Log all search params to debug
    const params = Object.fromEntries(searchParams.entries());
    console.log("All URL parameters:", params);

    // Get the raw URL to check for any encoding issues
    const rawUrl = window.location.href;
    console.log("Raw URL:", rawUrl);

    const type = searchParams.get("type");
    const code = searchParams.get("code");
    
    console.log("Reset password parameters:", { type, code });
    
    // Check for required parameters
    if (!type || !code) {
      console.log("Missing required parameters");
      router.replace("/login");
      toast.error("Invalid password reset link");
      return;
    }

    // For password reset, we don't need to exchange the code
    // We just need to verify that we have a valid code and type
    if (type === "recovery" && code) {
      // Get the email from the URL if available
      const emailParam = searchParams.get("email");
      if (emailParam) {
        setEmail(emailParam);
      } else {
        // Try to get the email from the session
        const supabase = createClient();
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user?.email) {
            setEmail(session.user.email);
          }
        });
      }
      setIsValidLink(true);
    } else {
      console.log("Invalid type or missing code");
      router.replace("/login");
      toast.error("Invalid password reset link");
    }
  }, [searchParams, router]);

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }

        // Validate password strength
        const validation = validatePassword(password);
        if (!validation.isValid) {
          validation.errors.forEach(error => toast.error(error));
          return;
        }

        const supabase = createClient();

        // Update the user's password using the recovery code
        const { error } = await supabase.auth.updateUser({
          password
        });

        if (error) throw error;

        toast.success("Password has been reset successfully");
        // Sign out the user to prevent auto-login
        await supabase.auth.signOut();
        router.replace("/login");
      } catch (error: any) {
        console.error("Password update error:", error);
        toast.error(error.message || "Failed to reset password");
      }
    });
  };

  if (!isValidLink) {
    return null;
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-md">
            <Worm className="size-4" />
          </div>
          PixCell
        </Link>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Reset Your Password</CardTitle>
            <CardDescription>
              {email ? (
                <span className="text-muted-foreground">
                  Enter new password for <span className="font-medium text-foreground">{email}</span>
                </span>
              ) : (
                "Loading..."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              {email && (
                <Input
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
              )}
              <Input
                name="password"
                type="password"
                placeholder="New password"
                required
                minLength={8}
              />
              <Input
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                required
                minLength={8}
              />
              <div className="text-xs text-muted-foreground">
                Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 