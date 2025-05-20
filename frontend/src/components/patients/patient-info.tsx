"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

export function PatientInfo({ patient }: { patient: any }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!patient) return <div>No patient found.</div>;

  const filteredKeys = Object.keys(patient).filter(
    (key) => key !== "imageUrl" && key !== "notes",
  );

  const copyToClipboard = (value: string, fieldName: string) => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopiedField(fieldName);
        toast.success(
          `Copied ${fieldName.replace(/([A-Z])/g, " $1").trim()} to clipboard`,
        );
        setTimeout(() => setCopiedField(null), 2000);
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard");
      });
  };

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {filteredKeys.map((key) => (
        <Card
          key={key}
          className="gap-0 px-0 py-2 shadow-sm transition-shadow hover:shadow-md"
        >
          <CardHeader className="flex flex-row items-center justify-between px-4 pt-0 pb-2">
            <CardTitle className="text-muted-foreground text-xs">
              {key
                .replace(/([A-Z])/g, " $1")
                .trim()
                .toUpperCase()}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => copyToClipboard(String(patient[key]), key)}
            >
              {copiedField === key ? (
                <Check className="text-primary h-4 w-4" />
              ) : (
                <Copy className="text-primary h-4 w-4" />
              )}
            </Button>
          </CardHeader>
          <CardContent className="px-4">
            <p className="truncate text-base font-medium">
              {String(patient[key])}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
