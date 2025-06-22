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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { signupAction } from "@/actions/users";
import toast from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { validatePassword } from "@/utils/password";

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClickSignupButton = async (formData: FormData) => {
    startTransition(async () => {
      const password = formData.get("password") as string;
      
      // Validate password strength
      const validation = validatePassword(password);
      if (!validation.isValid) {
        validation.errors.forEach(error => toast.error(error));
        return;
      }

      const { errorMessage } = await signupAction(formData);
      if (!errorMessage) {
        toast.success("Account created! Please check your email to confirm your account before logging in.");
        router.replace("/login");
      } else {
        toast.error(errorMessage);
      }
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your PixCell account</CardTitle>
          <CardDescription>
            Get started with secure, collaborative access to microscopic imaging
            and patient data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={e => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleClickSignupButton(formData);
          }}>
            <div className="grid gap-6">
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Sign up to continue
                </span>
              </div>
              <div className="grid gap-4">
                <div className="flex w-full gap-2">
                  <Input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    required
                    disabled={isPending}
                  />
                  <Input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    required
                    disabled={isPending}
                  />
                </div>

                <Select name="roleId" disabled={isPending} required>
                  <SelectTrigger className="w-full">
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
                  </SelectContent>
                </Select>
                <Input
                  name="email"
                  id="email"
                  type="email"
                  placeholder="Email"
                  required
                  disabled={isPending}
                />
                <Input
                  name="password"
                  id="password"
                  type="password"
                  placeholder="Password"
                  required
                  minLength={8}
                  disabled={isPending}
                />
                <div className="text-xs text-muted-foreground">
                  Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Creating account..." : "Sign Up"}
                </Button>
              </div>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline underline-offset-4">
                  Log in
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground [&_a]:hover:text-primary text-center text-xs text-balance [&_a]:underline [&_a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
