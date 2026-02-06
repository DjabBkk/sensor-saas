"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDeviceStatus } from "@/lib/deviceStatus";

export default function WidgetsDashboardPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);

  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      router.replace("/login");
      return;
    }
    if (convexUserId || !user) return;

    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) return;

    let cancelled = false;
    getOrCreateUser({
      authId: userId,
      email,
      name: user.fullName ?? undefined,
    })
      .then((id) => {
        if (!cancelled) setConvexUserId(id);
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, user, convexUserId, getOrCreateUser, router]);

  const devices = useQuery(
    api.devices.list,
    convexUserId ? { userId: convexUserId } : "skip"
  );

  if (!convexUserId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">Widgets & Embeds</h1>
        <p className="text-sm text-muted-foreground">
          Create embeddable widgets for your website or generate tokens for kiosk displays.
        </p>
      </div>

      {devices?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-sm text-muted-foreground">
              No devices found. Add a device to create widgets.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {devices?.map((device) => {
            const status = getDeviceStatus({
              lastReadingAt: device.lastReadingAt,
              lastBattery: device.lastBattery,
              providerOffline: device.providerOffline,
              createdAt: device.createdAt,
            });

            return (
              <Card key={device._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{device.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {device.model ?? "Qingping"}
                    </Badge>
                    <Badge variant={status.isOnline ? "default" : "secondary"}>
                      {status.isOnline ? "Online" : "Offline"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Create embed tokens and manage widgets for this device.
                </p>
                <Link href={`/dashboard/device/${device._id}/embed`}>
                  <Button className="w-full">Manage Widgets</Button>
                </Link>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
