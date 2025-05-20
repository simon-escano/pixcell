import { Worm } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export default function LoginPage() {
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
        <LoginForm />
      </div>
    </div>
  );
}

export const metadata = {
  title: "Login - PixCell",
};
