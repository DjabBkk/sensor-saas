"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPlanLimits } from "@/convex/lib/planLimits";
import { KioskSingle } from "@/components/kiosk/KioskSingle";
import { KioskGrid } from "@/components/kiosk/KioskGrid";

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
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Array<string>>([]);
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState<string | null>(null);

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
  const allUserTokens = useQuery(
    api.embedTokens.listForUser,
    convexUserId ? { userId: convexUserId } : "skip",
  );
  const convexUser = useQuery(
    api.users.getCurrentUser,
    userId ? { authId: userId } : "skip",
  );

  // Get the first selected device's latest reading for preview
  const previewDeviceId = mode === "single" ? selectedDeviceId : selectedDeviceIds[0] ?? null;
  const previewReading = useQuery(
    api.readings.latest,
    previewDeviceId ? { deviceId: previewDeviceId as Id<"devices"> } : "skip",
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

  // Limit enforcement — shared or per-type
  const planLimits = convexUser?.plan ? getPlanLimits(convexUser.plan) : null;
  const activeWidgetCount = useMemo(
    () => (allUserTokens ?? []).filter((t) => !t.isRevoked).length,
    [allUserTokens],
  );

  const isSharedLimit = planLimits?.sharedWidgetKioskLimit !== null && planLimits?.sharedWidgetKioskLimit !== undefined;
  const combinedCount = activeKiosks.length + activeWidgetCount;
  const displayLimit = isSharedLimit
    ? planLimits!.sharedWidgetKioskLimit!
    : planLimits?.maxKiosks ?? null;
  const displayCount = isSharedLimit ? combinedCount : activeKiosks.length;
  const atLimit =
    displayLimit !== null && displayLimit !== Infinity && displayCount >= displayLimit;
  const limitLabel = isSharedLimit ? "widgets & kiosks" : "kiosks";

  // Refresh interval options (same approach as embed page)
  const ALL_REFRESH_OPTIONS = [
    { value: 60, label: "1 minute" },
    { value: 5 * 60, label: "5 minutes" },
    { value: 10 * 60, label: "10 minutes" },
    { value: 15 * 60, label: "15 minutes" },
    { value: 30 * 60, label: "30 minutes" },
    { value: 60 * 60, label: "1 hour" },
  ];

  const PLAN_MIN_REFRESH: Record<string, number> = {
    starter: 3600,
    pro: 1800,
    business: 300,
    custom: 60,
  };

  const refreshIntervalOptions = useMemo(() => {
    if (!convexUser?.plan) return [];
    const minInterval = PLAN_MIN_REFRESH[convexUser.plan] ?? 3600;
    return ALL_REFRESH_OPTIONS.filter((opt) => opt.value >= minInterval);
  }, [convexUser?.plan]);

  // Set default refresh interval based on plan
  useEffect(() => {
    if (convexUser?.plan && refreshInterval === null) {
      const minInterval = PLAN_MIN_REFRESH[convexUser.plan] ?? 3600;
      setRefreshInterval(minInterval);
    }
  }, [convexUser?.plan, refreshInterval]);

  // Build preview data
  const previewDevices = useMemo(() => {
    if (!devices) return [];
    if (mode === "single") {
      const d = devices.find((dev) => dev._id === selectedDeviceId);
      return d ? [d] : [];
    }
    return devices.filter((dev) => selectedDeviceIds.includes(dev._id));
  }, [devices, mode, selectedDeviceId, selectedDeviceIds]);

  const handleToggleDevice = (deviceId: string) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId],
    );
  };

  const handleCreate = async () => {
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

    if (refreshInterval === null) {
      setError("Select a refresh interval.");
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
        refreshInterval,
      });
      setLabel("");
      setSelectedDeviceIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create kiosk.");
    }
  };

  const handleCopy = async (value: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">Kiosk screens</h1>
        <p className="text-sm text-muted-foreground">
          Create fullscreen kiosk links for screens and wall displays.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create kiosk</CardTitle>
                {displayLimit !== null && (
                  <span className="text-sm text-muted-foreground">
                    {displayCount}/{displayLimit === Infinity ? "\u221E" : displayLimit} {limitLabel}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {atLimit && (
                <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm">
                  You&apos;ve reached your {limitLabel} limit.{" "}
                  <Link href="/dashboard/account" className="font-medium underline">
                    Upgrade your plan
                  </Link>{" "}
                  to create more.
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="label">Label</Label>
                  <Input
                    id="label"
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    placeholder="Lobby wall, Office screen, etc."
                    disabled={atLimit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <Select
                    value={mode}
                    onValueChange={(val) => setMode(val as KioskMode)}
                    disabled={atLimit}
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
                    disabled={atLimit}
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
                  <Label>Update frequency</Label>
                  <Select
                    value={refreshInterval !== null ? String(refreshInterval) : undefined}
                    onValueChange={(val) => setRefreshInterval(Number(val))}
                    disabled={atLimit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {refreshIntervalOptions.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Devices</Label>
                {mode === "single" ? (
                  <Select
                    value={selectedDeviceId ?? undefined}
                    onValueChange={setSelectedDeviceId}
                    disabled={atLimit}
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
                          disabled={atLimit}
                        />
                        {device.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {error ? <p className="text-sm text-red-500">{error}</p> : null}
              <Button onClick={handleCreate} disabled={atLimit}>
                Create kiosk link
              </Button>
            </CardContent>
          </Card>

          <Card>
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
                        <Button variant="outline" onClick={() => handleCopy(url)}>
                          Copy Link
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => revokeKiosk({ configId: kiosk._id })}
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

        {/* Preview panel */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Kiosk preview</CardTitle>
          </CardHeader>
          <CardContent>
            {previewDevices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Select a device to see a preview.
              </p>
            ) : (
              <div className={theme === "dark" ? "dark" : ""}>
                <div
                  className="rounded-lg border border-border bg-background p-4 text-foreground"
                  style={theme === "light" ? {
                    colorScheme: "light",
                    backgroundColor: "#FAF9F7",
                    color: "#1C1917",
                    "--background": "#FAF9F7",
                    "--foreground": "#1C1917",
                    "--card": "#FFFFFF",
                    "--card-foreground": "#1C1917",
                    "--border": "#E7E5E4",
                    "--muted": "#F5F5F4",
                    "--muted-foreground": "#78716C",
                  } as React.CSSProperties & Record<string, string> : undefined}
                >
                  {mode === "single" ? (
                    <KioskSingle
                      deviceName={previewDevices[0].name}
                      model={previewDevices[0].model ?? undefined}
                      isOnline={true}
                      pm25={previewReading?.pm25}
                      co2={previewReading?.co2}
                      tempC={previewReading?.tempC}
                      rh={previewReading?.rh}
                    />
                  ) : (
                    <KioskGrid
                      devices={previewDevices.map((dev) => ({
                        deviceId: dev._id,
                        deviceName: dev.name,
                        isOnline: true,
                        // For multi-device, we only have reading data for the first device
                        // In the actual kiosk, the server fetches all readings
                        pm25: dev._id === previewDeviceId ? previewReading?.pm25 : undefined,
                        co2: dev._id === previewDeviceId ? previewReading?.co2 : undefined,
                        tempC: dev._id === previewDeviceId ? previewReading?.tempC : undefined,
                        rh: dev._id === previewDeviceId ? previewReading?.rh : undefined,
                      }))}
                    />
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
