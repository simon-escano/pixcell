
import ClientServiceWorkerRegister from "@/components/ClientServiceWorkerRegister";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PixCell",
  description:
    " A deep learning-powered app for analyzing and detecting patterns in microscopic images, with collaborative note-taking and research features.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true} className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClientServiceWorkerRegister />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense>
            {children}
          </Suspense>
          <Toaster
            toastOptions={{
              style: {
                backgroundColor: "var(--card)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
                boxShadow: "0 10px 30px -10px rgba(0,0,0,0.35)",
                borderRadius: "1rem",
                padding: "12px 14px",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
