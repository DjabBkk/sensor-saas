"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type KioskMode = "single" | "multi";
type KioskTheme = "dark" | "light";

export default function KioskDashboardPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const createKiosk = useMutation(api.kioskConfigs.create);
  const revokeKiosk = useMutation(api.kioskConfigs.revoke);

  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const [label, setLabel] = useState("");
  const [mode, setMode] = useState<KioskMode>("single");
  const [theme, setTheme] = useState<KioskTheme>("dark");
  const [refreshInterval, setRefreshInterval] = useState("30");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Array<string>>([]);
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isComingSoon = true;

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const devices = useQuery(
    api.devices.list,
    convexUserId ? { userId: convexUserId } : "skip",
  );
  const kiosks = useQuery(
    api.kioskConfigs.listForUser,
    convexUserId ? { userId: convexUserId } : "skip",
  );

  useEffect(() => {
    if (!selectedDeviceId && devices?.length) {
      setSelectedDeviceId(devices[0]._id);
    }
  }, [devices, selectedDeviceId]);

  const activeKiosks = useMemo(
    () => (kiosks ?? []).filter((kiosk) => !kiosk.isRevoked),
    [kiosks],
  );

  const handleToggleDevice = (deviceId: string) => {
    if (isComingSoon) return;
    setSelectedDeviceIds((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId],
    );
  };

  const handleCreate = async () => {
    if (isComingSoon) return;
    if (!convexUserId) {
      setError("User sync not ready yet.");
      return;
    }

    const deviceIds =
      mode === "single"
        ? selectedDeviceId
          ? [selectedDeviceId]
          : []
        : selectedDeviceIds;

    if (deviceIds.length === 0) {
      setError("Select at least one device.");
      return;
    }

    const intervalSeconds = Number(refreshInterval);
    if (!Number.isFinite(intervalSeconds) || intervalSeconds <= 0) {
      setError("Refresh interval must be a positive number.");
      return;
    }

    setError(null);
    try {
      await createKiosk({
        userId: convexUserId,
        label: label || undefined,
        mode,
        deviceIds: deviceIds as Array<Id<"devices">>,
        theme,
        refreshInterval: intervalSeconds,
      });
      setLabel("");
      setSelectedDeviceIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create kiosk.");
    }
  };

  const handleCopy = async (value: string) => {
    if (isComingSoon) return;
    if (!value) return;
    await navigator.clipboard.writeText(value);
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Kiosk screens</h1>
          <Badge variant="secondary">Coming soon</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Create fullscreen kiosk links for screens and wall displays.
        </p>
      </div>

      <Card className={isComingSoon ? "opacity-60" : undefined}>
        <CardHeader>
          <CardTitle>Create kiosk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Lobby wall, Office screen, etc."
                disabled={isComingSoon}
              />
            </div>
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select
                value={mode}
                onValueChange={(val) => setMode(val as KioskMode)}
                disabled={isComingSoon}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single device</SelectItem>
                  <SelectItem value="multi">Multi-device grid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={theme}
                onValueChange={(val) => setTheme(val as KioskTheme)}
                disabled={isComingSoon}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refresh">Refresh interval (seconds)</Label>
              <Input
                id="refresh"
                value={refreshInterval}
                onChange={(event) => setRefreshInterval(event.target.value)}
                placeholder="30"
                disabled={isComingSoon}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Devices</Label>
            {mode === "single" ? (
              <Select
                value={selectedDeviceId ?? undefined}
                onValueChange={setSelectedDeviceId}
                disabled={isComingSoon}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  {devices?.map((device) => (
                    <SelectItem key={device._id} value={device._id}>
                      {device.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {devices?.map((device) => (
                  <label
                    key={device._id}
                    className="flex items-center gap-2 rounded border border-border px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDeviceIds.includes(device._id)}
                      onChange={() => handleToggleDevice(device._id)}
                      disabled={isComingSoon}
                    />
                    {device.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <Button onClick={handleCreate} disabled={isComingSoon}>
            Create kiosk link
          </Button>
        </CardContent>
      </Card>

      <Card className={isComingSoon ? "opacity-60" : undefined}>
        <CardHeader>
          <CardTitle>Active kiosks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeKiosks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No kiosks yet.</p>
          ) : (
            activeKiosks.map((kiosk) => {
              const url = `${origin}/kiosk/${kiosk.token}`;
              return (
                <div
                  key={kiosk._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{kiosk.label ?? "Kiosk"}</p>
                    <p className="text-xs text-muted-foreground">{url}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleCopy(url)} disabled={isComingSoon}>
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => revokeKiosk({ configId: kiosk._id })}
                      disabled={isComingSoon}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
