"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CustomAlertDialog } from "@/components/custom-alert-dialog"
import { AlertCircle, ArrowLeft, XCircle } from "lucide-react"
import Link from "next/link"
import React from "react"

export default function ReportNotFound({ code }: { code: string }) {
  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Report Not Found</h3>
              <p className="text-gray-600 mt-1">
                The report with code <span className="font-mono bg-gray-100 px-2 py-1 rounded">{code}</span> could not
                be found or may have expired.
              </p>
            </div>
            <CustomAlertDialog
              title={<span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Trouble Accessing Report</span>}
              description={
                "Please check the report code and try again. If you continue to have issues, contact your healthcare provider."
              }
              confirmText="OK"
              onConfirm={() => {}}
            />
            <div className="flex gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link href="/reports/view">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Try Another Code
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 