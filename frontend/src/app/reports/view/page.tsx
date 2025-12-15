"use client"

import type React from "react"

import PixCellLogo from "@/components/pixcell-logo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  KeyRound,
  Moon,
  QrCode,
  Search,
  Shield,
  Sun
} from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter, useParams } from "next/navigation"
import { useState } from "react"

export default function ImprovedReportViewPage() {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { setTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      setError("Please enter a report code")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Basic validation for report code format
      const cleanCode = code.trim(); // Remove .toUpperCase()
      if (cleanCode.length < 6) {
        setError("Report code must be at least 6 characters long")
        setIsLoading(false)
        return
      }

      // Navigate to the report view
      router.push(`/reports/view/${encodeURIComponent(cleanCode)}`)
    } catch (error) {
      setError("An error occurred while accessing the report")
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCode(value)
    if (error) setError("") // Clear error when user starts typing
  }

  const handleScanQR = () => {
    // Placeholder for QR code scanning functionality
    // This would typically open a camera/QR scanner
    alert("QR code scanning feature would be implemented here")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Light/Dark Mode Toggle in upper right */}
      <div className="flex absolute top-6 right-6 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/login")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Login</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Toggle theme">
              <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="w-full max-w-2xl space-y-8">
        {/* Centered PixCell Logo and Text */}
        <div className="flex gap-4 items-center justify-center mt-8 mb-8">
          <PixCellLogo className="size-12 mb-2" />
          <h1 className="text-base font-normal text-foreground tracking-tight">PixCell</h1>
        </div>
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-4">
            <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="size-6 text-primary" />
            </div>
            <h1 className="text-base font-normal text-foreground">View Medical Report</h1>
          </div>
          <p className="text-muted-foreground mt-2">Enter your report code to access your medical report securely</p>
        </div>

        {/* Main Form Card */}
        <Card className="shadow-lg bg-card text-card-foreground">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Enter Report Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="code"
                    type="text"
                    value={code}
                    onChange={handleInputChange}
                    placeholder="Enter your report code (e.g., ABC123XYZ)"
                    className={`pr-12 text-center font-mono text-lg tracking-wider ${
                      error ? "border-destructive focus:border-destructive" : ""
                    }`}
                    required
                    autoComplete="off"
                    maxLength={20}
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
                {error && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Report codes are case-insensitive and typically 6-12 characters long
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" disabled={!code.trim() || isLoading} className="flex-1 flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Accessing Report...
                    </>
                  ) : (
                    <>
                      View Report
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <Separator />

            {/* Alternative Access Methods */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Alternative Access Methods</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <QrCode className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">QR Code</p>
                    <p className="text-xs text-muted-foreground">Scan the QR code from your report</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <KeyRound className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Report Code</p>
                    <p className="text-xs text-muted-foreground">Enter the code manually</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Information */}
        <Card className="bg-card text-card-foreground">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Secure Access</h4>
                  <p className="text-sm text-muted-foreground">All reports are encrypted and require valid codes to access</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Time-Limited</h4>
                  <p className="text-sm text-muted-foreground">Report access may expire after a certain period</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">HIPAA Compliant</h4>
                  <p className="text-sm text-muted-foreground">Your medical information is protected by industry standards</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Audit Trail</h4>
                  <p className="text-sm text-muted-foreground">All access attempts are logged for security purposes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="bg-card text-card-foreground">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <h3 className="font-medium text-foreground">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                If you're having trouble accessing your report, please contact your healthcare provider or our support
                team.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Badge variant="outline" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-warning" />
                  Support: support@pixcell.com
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-warning" />
                  Phone: +1 (555) 123-4567
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2024 PixCell. All rights reserved.</p>
          <p className="mt-1">
            By accessing this report, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
