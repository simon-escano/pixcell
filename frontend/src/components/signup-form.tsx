"use client";

import { cn } from "@/lib/utils";
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
} from "./ui/select";

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClickSignupButton = async (formData: FormData) => {
    startTransition(async () => {
      const { errorMessage } = await signupAction(formData);
      if (!errorMessage) {
        router.replace("/");
        toast.success("Account successfully created\nYou are now logged in", {
          duration: 5000,
        });
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
          <form action={handleClickSignupButton}>
            <div className="grid gap-6">
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-background text-muted-foreground relative z-10 px-2">
                  Sign up to continue
                </span>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-4">
                  <div className="flex w-full gap-2">
                    <Input
                      type="text"
                      name="firstname"
                      placeholder="First Name"
                      required
                      disabled={isPending}
                    />
                    <Input
                      type="text"
                      name="lastname"
                      placeholder="Last Name"
                      required
                      disabled={isPending}
                    />
                  </div>

                  <Select name="role" disabled={isPending} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="41ae0f54-b306-4ae2-9bb6-c33776fae906">
                        Pathologist
                      </SelectItem>
                      <SelectItem value="7e12a5bb-597c-4d69-8e2e-90666c08d6f7">
                        Hematologist
                      </SelectItem>
                      <SelectItem value="f080882b-2922-42a3-800b-50a65e2c4822">
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
                  />
                  <Input
                    name="password"
                    id="password"
                    type="password"
                    placeholder="Password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full cursor-pointer">
                  Sign Up
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
