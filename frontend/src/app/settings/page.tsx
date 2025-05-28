import Base from "@/components/base";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsAppearance } from "@/components/settings/appearance";
import { SettingsAccount } from "@/components/settings/account";

export default function SettingsPage() {
  return (
    <Base>
      <div className="container mx-auto py-10">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
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
                <SettingsAppearance />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <SettingsAccount />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Base>
  );
} 