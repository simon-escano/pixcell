"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Session, EmailOtpType } from "@supabase/supabase-js";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isValidLink, setIsValidLink] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if(!searchParams) {
      console.log("searchParams is null");
      router.replace("/login");
      toast.error("Invalid password reset link");
      return;
    }
    const type = searchParams.get("type") as EmailOtpType | null;
    const token_hash = searchParams.get("token_hash");
    console.log("Reset password parameters:", { type, token_hash, rawUrl: window.location.href });

    if (!type || !token_hash || type !== "recovery") {
      console.log("Invalid or missing parameters");
      toast.error("Invalid password reset link");
      router.replace("/login");
      return;
    }

    // Verify the OTP to establish a session
    supabase.auth.verifyOtp({ type, token_hash }).then(({ error }) => {
      console.log("Verify OTP response:", { error });
      if (error) {
        console.error("Verify OTP error:", error);
        toast.error("Invalid or expired password reset link");
        router.replace("/login");
        return;
      }

      // Check session after verification
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        console.log("Session check after OTP:", { session, error });
        if (error || !session?.user?.email) {
          console.log("No valid session found");
          toast.error("Unable to verify user session");
          router.replace("/login");
          return;
        }
        setEmail(session.user.email);
        setIsValidLink(true);
      });
    });

    // Listen for auth state changes (for debugging)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session: Session | null) => {
        console.log("Auth state change:", { event, session });
        if (event === "PASSWORD_RECOVERY" && session?.user?.email) {
          setEmail(session.user.email);
          setIsValidLink(true);
        }
      }
    );

    // Cleanup subscription
    return () => {
      // Only synchronous cleanup here
      subscription.unsubscribe();
    };
  }, [searchParams, router, supabase]);

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;
        console.log("Submitting new password for:", email);

        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }

        const validation = validatePassword(password);
        if (!validation.isValid) {
          validation.errors.forEach((error) => toast.error(error));
          return;
        }

        const { error } = await supabase.auth.updateUser({ password });
        console.log("Update user response:", { error });

        if (error) {
          throw new Error(error.message || "Failed to reset password");
        }

        toast.success("Password updated successfully!");
        await supabase.auth.signOut();
        router.replace("/login");
      } catch (error: any) {
        console.error("Password update error:", error);
        toast.error(error.message || "Failed to reset password");
      }
    });
  };

  if (!isValidLink) return null;

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
                  Enter new password for{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </span>
              ) : (
                "Enter your new password below"
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