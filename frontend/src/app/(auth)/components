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
import { loginAction } from "@/actions/users";
import toast from "react-hot-toast";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClickLoginButton = async (formData: FormData) => {
    startTransition(async () => {
      const { errorMessage } = await loginAction(formData);
      if (!errorMessage) {
        router.replace("/");
        toast.success("Successfully logged in");
      } else {
        toast.error(errorMessage);
      }
    });
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
          <form action={handleClickLoginButton}>
            <div className="grid gap-6">
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Log in to continue
                </span>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-4">
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
                <div className="flex flex-col items-center gap-2">
                  <Button type="submit" className="w-full cursor-pointer">
                    Login
                  </Button>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
              </div>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="underline underline-offset-4">
                  Sign up
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
