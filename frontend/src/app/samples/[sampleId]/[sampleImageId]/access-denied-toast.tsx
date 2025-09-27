"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AccessDeniedToastProps {
  message: string;
}

export default function AccessDeniedToast({ message }: AccessDeniedToastProps) {
  const router = useRouter();

  useEffect(() => {
    // Show toast notification
    toast.error(message, {
      duration: 5000,
      position: "top-center",
    });
  }, [message]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md mx-auto shadow-xl border-2 border-destructive/20 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-xl font-semibold text-destructive">
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {message}
          </p>
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => router.push('/samples')}
              className="w-full"
              variant="default"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Samples
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
