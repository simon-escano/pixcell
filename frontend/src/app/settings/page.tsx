import Base from "@/components/base";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsAppearance } from "@/components/settings/appearance";
import { SettingsAccount } from "@/components/settings/account";
import { Suspense } from "react";

export const metadata = {
  title: "PixCell | Settings",
};

// Force dynamic rendering for settings (needs auth)
export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <Base>
      <div className="container max-w-screen-lg mx-auto p-6 md:p-10">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">
              Manage your account settings and preferences.
            </p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="h-20 animate-pulse bg-muted rounded" />}>
                  <SettingsAppearance />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="h-20 animate-pulse bg-muted rounded" />}>
                  <SettingsAccount />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Base>
  );
} 