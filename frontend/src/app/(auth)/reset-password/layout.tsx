import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PixCell | Reset Password",
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

