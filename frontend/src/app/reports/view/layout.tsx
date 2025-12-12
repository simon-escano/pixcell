import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PixCell | View Report",
};

export default function ViewReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

