"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useTheme } from "next-themes";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Bell, Moon } from "lucide-react";

export default function SettingsPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const { resolvedTheme, setTheme } = useTheme();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const isDarkMode = resolvedTheme === "dark";

  // Get or create Convex user
  useEffect(() => {
    if (!isLoaded || !userId || convexUserId || !user) return;

    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) return;

    getOrCreateUser({
      authId: userId,
      email,
      name: user.fullName ?? undefined,
    })
      .then(setConvexUserId)
      .catch(console.error);
  }, [isLoaded, userId, user, convexUserId, getOrCreateUser]);

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your preferences and notification settings
        </p>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive alerts about your air quality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-alerts">Email Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications when air quality is poor
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">Coming soon</Badge>
              <Switch
                id="email-alerts"
                checked={emailAlerts}
                onCheckedChange={setEmailAlerts}
                disabled
              />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get instant notifications on your device
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">Coming soon</Badge>
              <Switch
                id="push-notifications"
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
                disabled
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how AirView looks on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Use dark theme throughout the app
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={isDarkMode}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button disabled>Save Changes</Button>
      </div>
    </div>
  );
}
