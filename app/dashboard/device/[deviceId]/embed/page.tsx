"use client";

import { useCallback, useEffect, useMemo, useRef, useState, use } from "react";
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
import { getDeviceStatus } from "@/lib/deviceStatus";
import { getPlanLimits } from "@/convex/lib/planLimits";
import { BadgeSmall } from "@/components/embed/BadgeSmall";
import { BadgeMedium } from "@/components/embed/BadgeMedium";
import { BadgeLarge } from "@/components/embed/BadgeLarge";
import { CardSmall } from "@/components/embed/CardSmall";
import { CardMedium } from "@/components/embed/CardMedium";
import { CardLarge } from "@/components/embed/CardLarge";
import { type BrandingProps } from "@/components/embed/Branding";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type EmbedStyle = "badge" | "card";
type EmbedTheme = "light" | "dark";
type EmbedSize = "small" | "medium" | "large";

export default function DeviceEmbedPage({
  params,
}: {
  params: Promise<{ deviceId: string }>;
}) {
  const { deviceId } = use(params);
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const createToken = useMutation(api.embedTokens.create);
  const revokeToken = useMutation(api.embedTokens.revoke);
  const updateRefreshInterval = useMutation(api.embedTokens.updateRefreshInterval);
  const updateBranding = useMutation(api.embedTokens.updateBranding);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState<EmbedStyle>("card");
  const [theme, setTheme] = useState<EmbedTheme>("dark");
  const [size, setSize] = useState<EmbedSize>("medium");
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Branding state
  const [brandName, setBrandName] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [logoStorageId, setLogoStorageId] = useState<Id<"_storage"> | undefined>(undefined);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | undefined>(undefined);
  const [hideAirViewBranding, setHideAirViewBranding] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  const device = useQuery(api.devices.get, { deviceId: deviceId as Id<"devices"> });
  const tokens = useQuery(api.embedTokens.listForDevice, {
    deviceId: deviceId as Id<"devices">,
  });
  const latestReading = useQuery(api.readings.latest, {
    deviceId: deviceId as Id<"devices">,
  });
  const history = useQuery(api.readings.history, {
    deviceId: deviceId as Id<"devices">,
    limit: 96,
  });
  const convexUser = useQuery(
    api.users.getCurrentUser,
    userId ? { authId: userId } : "skip"
  );
  const allUserTokens = useQuery(
    api.embedTokens.listForUser,
    convexUserId ? { userId: convexUserId } : "skip",
  );
  const allUserKiosks = useQuery(
    api.kioskConfigs.listForUser,
    convexUserId ? { userId: convexUserId } : "skip",
  );

  const activeTokens = useMemo(
    () => (tokens ?? []).filter((token) => !token.isRevoked),
    [tokens],
  );

  // Widget limit enforcement — shared or per-type
  const allActiveTokenCount = useMemo(
    () => (allUserTokens ?? []).filter((t) => !t.isRevoked).length,
    [allUserTokens],
  );
  const activeKioskCount = useMemo(
    () => (allUserKiosks ?? []).filter((k) => !k.isRevoked).length,
    [allUserKiosks],
  );
  const planLimits = convexUser?.plan ? getPlanLimits(convexUser.plan) : null;
  const isSharedLimit = planLimits?.sharedWidgetKioskLimit !== null && planLimits?.sharedWidgetKioskLimit !== undefined;
  const combinedCount = allActiveTokenCount + activeKioskCount;
  const displayLimit = isSharedLimit
    ? planLimits!.sharedWidgetKioskLimit!
    : planLimits?.maxWidgets ?? null;
  const displayCount = isSharedLimit ? combinedCount : allActiveTokenCount;
  const atWidgetLimit =
    displayLimit !== null && displayLimit !== Infinity && displayCount >= displayLimit;
  const limitLabel = isSharedLimit ? "widgets & kiosks" : "widgets";

  useEffect(() => {
    if (activeTokens.length && !selectedTokenId) {
      setSelectedTokenId(activeTokens[0]._id);
    }
  }, [activeTokens, selectedTokenId]);

  const selectedToken = activeTokens.find((token) => token._id === selectedTokenId);

  // Query for logo URL from storage ID
  const logoUrlFromStorage = useQuery(
    api.storage.getLogoUrl,
    selectedToken?.logoStorageId ? { storageId: selectedToken.logoStorageId } : "skip",
  );

  useEffect(() => {
    if (!selectedToken) return;
    if (selectedToken.description !== undefined) {
      setDescription(selectedToken.description ?? "");
    }
    if (selectedToken.size) {
      setSize(selectedToken.size);
    }
    if (selectedToken.refreshInterval !== undefined) {
      setRefreshInterval(selectedToken.refreshInterval);
    }
    // Sync branding state
    setBrandName(selectedToken.brandName ?? "");
    setBrandColor(selectedToken.brandColor ?? "");
    setLogoStorageId(selectedToken.logoStorageId ?? undefined);
    setHideAirViewBranding(selectedToken.hideAirViewBranding ?? false);
  }, [selectedToken]);

  // Update logo preview URL when storage query resolves
  useEffect(() => {
    if (logoUrlFromStorage) {
      setLogoPreviewUrl(logoUrlFromStorage);
    } else if (!selectedToken?.logoStorageId) {
      setLogoPreviewUrl(undefined);
    }
  }, [logoUrlFromStorage, selectedToken?.logoStorageId]);

  // All possible refresh interval options (most frequent first)
  const ALL_REFRESH_OPTIONS = [
    { value: 60, label: "1 minute" },
    { value: 5 * 60, label: "5 minutes" },
    { value: 10 * 60, label: "10 minutes" },
    { value: 15 * 60, label: "15 minutes" },
    { value: 30 * 60, label: "30 minutes" },
    { value: 60 * 60, label: "1 hour" },
  ];

  // Min refresh interval per plan (seconds)
  const PLAN_MIN_REFRESH: Record<string, number> = {
    starter: 3600,  // 60 min
    pro: 1800,      // 30 min
    business: 300,  // 5 min
    custom: 60,     // 1 min
  };

  // Generate refresh interval options based on plan
  const refreshIntervalOptions = useMemo(() => {
    if (!convexUser?.plan) return [];
    const minInterval = PLAN_MIN_REFRESH[convexUser.plan] ?? 3600;
    return ALL_REFRESH_OPTIONS.filter((opt) => opt.value >= minInterval);
  }, [convexUser?.plan]);

  // Set default refresh interval based on plan when user loads
  useEffect(() => {
    if (convexUser?.plan && refreshInterval === null) {
      const minInterval = PLAN_MIN_REFRESH[convexUser.plan] ?? 3600;
      setRefreshInterval(minInterval);
    }
  }, [convexUser?.plan, refreshInterval]);
  const widgetDimensions = useMemo(() => {
    if (style === "badge") {
      if (size === "small") return { width: 160, height: 40 };
      if (size === "large") return { width: 360, height: 88 };
      return { width: 240, height: 64 };
    }
    if (size === "small") return { width: 280, height: 180 };
    if (size === "large") return { width: 420, height: 320 };
    return { width: 320, height: 220 };
  }, [size, style]);

  const embedUrl = selectedToken
    ? `${origin}/embed/${style}/${selectedToken.token}?theme=${theme}&size=${size}`
    : "";

  const iframeSnippet = embedUrl
    ? `<iframe src="${embedUrl}" width="${widgetDimensions.width}" height="${widgetDimensions.height}" frameborder="0"></iframe>`
    : "";

  const scriptSnippet = selectedToken
    ? `<div id="airview-widget" data-token="${selectedToken.token}" data-style="${style}" data-theme="${theme}" data-size="${size}"></div>
<script src="${origin}/embed.js"></script>`
    : "";
  const previewTitle = selectedToken?.description ?? description;
  const previewHistory = history ?? [];

  // Compute branding for preview
  const previewBranding: BrandingProps = {
    brandName: brandName || undefined,
    brandColor: brandColor || undefined,
    logoUrl: logoPreviewUrl,
    hideAirViewBranding,
  };

  const canBrand = planLimits?.customBranding === true;

  const handleCreate = async () => {
    if (!convexUserId) {
      setError("User sync not ready yet.");
      return;
    }
    setError(null);
    try {
      const created = await createToken({
        userId: convexUserId,
        deviceId: deviceId as Id<"devices">,
        label: label || undefined,
        description: description || undefined,
        size,
      });
      setLabel("");
      setDescription("");
      setSelectedTokenId(created._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create token.");
    }
  };

  const handleUpdateRefreshInterval = async (tokenId: Id<"embedTokens">, newInterval: number) => {
    try {
      await updateRefreshInterval({
        tokenId,
        refreshInterval: newInterval,
      });
      setRefreshInterval(newInterval);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update refresh interval.");
    }
  };

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !convexUserId) return;

    setIsUploadingLogo(true);
    try {
      const uploadUrl = await generateUploadUrl({ userId: convexUserId });
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      setLogoStorageId(storageId);
      setLogoPreviewUrl(URL.createObjectURL(file));

      // Auto-save branding if a token is selected
      if (selectedTokenId) {
        await updateBranding({
          tokenId: selectedTokenId as Id<"embedTokens">,
          brandName: brandName || undefined,
          brandColor: brandColor || undefined,
          logoStorageId: storageId,
          hideAirViewBranding,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload logo.");
    } finally {
      setIsUploadingLogo(false);
    }
  }, [convexUserId, generateUploadUrl, selectedTokenId, updateBranding, brandName, brandColor, hideAirViewBranding]);

  const handleSaveBranding = useCallback(async () => {
    if (!selectedTokenId) return;
    try {
      await updateBranding({
        tokenId: selectedTokenId as Id<"embedTokens">,
        brandName: brandName || undefined,
        brandColor: brandColor || undefined,
        logoStorageId: logoStorageId,
        hideAirViewBranding,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update branding.");
    }
  }, [selectedTokenId, updateBranding, brandName, brandColor, logoStorageId, hideAirViewBranding]);

  const handleCopy = async (value: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
  };

  const handleRevoke = async (tokenId: Id<"embedTokens">) => {
    await revokeToken({ tokenId });
    if (selectedTokenId === tokenId) {
      setSelectedTokenId(null);
    }
  };

  if (device === null) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Device not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">Embed widgets</h1>
        <p className="text-sm text-muted-foreground">
          Generate kiosk or website embeds for {device?.name ?? "this device"}.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create an embed token</CardTitle>
                {displayLimit !== null && (
                  <span className="text-sm text-muted-foreground">
                    {displayCount}/{displayLimit === Infinity ? "\u221E" : displayLimit} {limitLabel}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {atWidgetLimit && (
                <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm">
                  You&apos;ve reached your {limitLabel} limit.{" "}
                  <Link href="/dashboard/account" className="font-medium underline">
                    Upgrade your plan
                  </Link>{" "}
                  to create more.
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="label">Label (optional)</Label>
                <Input
                  id="label"
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="Lobby screen, Website badge, etc."
                  disabled={atWidgetLimit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Widget title (optional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Air Quality at Sprouts Kindergarten"
                  disabled={atWidgetLimit}
                />
              </div>
              {error ? <p className="text-sm text-red-500">{error}</p> : null}
              <Button onClick={handleCreate} disabled={atWidgetLimit}>
                Create Token
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manage tokens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeTokens.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active tokens yet.</p>
              ) : (
                activeTokens.map((token) => (
                  <div
                    key={token._id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{token.label ?? "Embed token"}</p>
                      {token.description && (
                        <p className="text-xs text-muted-foreground">{token.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{token.token}</p>
                    </div>
                    <Button variant="outline" onClick={() => handleRevoke(token._id)}>
                      Revoke
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Snippet generator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                <div className="space-y-2">
                  <Label>Token</Label>
                  <Select
                    value={selectedTokenId ?? undefined}
                    onValueChange={setSelectedTokenId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTokens.map((token) => (
                        <SelectItem key={token._id} value={token._id}>
                          {token.label ?? token.token.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Widget style</Label>
                  <Select value={style} onValueChange={(val) => setStyle(val as EmbedStyle)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="badge">Badge</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Select value={size} onValueChange={(val) => setSize(val as EmbedSize)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={theme} onValueChange={(val) => setTheme(val as EmbedTheme)}>
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
                    onValueChange={(val) => {
                      const newInterval = Number(val);
                      setRefreshInterval(newInterval);
                      if (selectedTokenId) {
                        handleUpdateRefreshInterval(selectedTokenId as Id<"embedTokens">, newInterval);
                      }
                    }}
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

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Embed URL</Label>
                  <div className="flex gap-2">
                    <Input value={embedUrl} readOnly />
                    <Button variant="outline" onClick={() => handleCopy(embedUrl)}>
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Iframe snippet</Label>
                  <div className="flex gap-2">
                    <Input value={iframeSnippet} readOnly />
                    <Button variant="outline" onClick={() => handleCopy(iframeSnippet)}>
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Script snippet</Label>
                  <div className="flex gap-2">
                    <Input value={scriptSnippet} readOnly />
                    <Button variant="outline" onClick={() => handleCopy(scriptSnippet)}>
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branding configuration (Pro+ plan) */}
          <Card>
            <CardHeader>
              <CardTitle>Custom branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!canBrand && (
                <div className="rounded-md border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm">
                  Custom branding is available on the Pro plan and above.{" "}
                  <Link href="/dashboard/account" className="font-medium underline">
                    Upgrade your plan
                  </Link>{" "}
                  to customize your widgets.
                </div>
              )}
              <fieldset disabled={!canBrand || !selectedTokenId} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="brandName">Brand name</Label>
                    <Input
                      id="brandName"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Your company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brandColor">Brand color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="brandColor"
                        value={brandColor || "#10b981"}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="h-9 w-12 cursor-pointer rounded border border-border"
                      />
                      <Input
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        placeholder="#10b981"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-3">
                    {logoPreviewUrl && (
                      <img
                        src={logoPreviewUrl}
                        alt="Logo preview"
                        className="h-10 w-10 rounded border border-border object-contain"
                      />
                    )}
                    <Button
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                    >
                      {isUploadingLogo ? "Uploading..." : logoPreviewUrl ? "Change logo" : "Upload logo"}
                    </Button>
                    {logoPreviewUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setLogoStorageId(undefined);
                          setLogoPreviewUrl(undefined);
                        }}
                      >
                        Remove
                      </Button>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hideWatermark"
                    checked={hideAirViewBranding}
                    onChange={(e) => setHideAirViewBranding(e.target.checked)}
                  />
                  <Label htmlFor="hideWatermark" className="cursor-pointer">
                    Hide &quot;Powered by AirView&quot; watermark
                  </Label>
                </div>
                <Button onClick={handleSaveBranding} disabled={!selectedTokenId}>
                  Save branding
                </Button>
              </fieldset>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Widget preview</CardTitle>
          </CardHeader>
          <CardContent>
            {!device ? (
              <p className="text-sm text-muted-foreground">Loading preview...</p>
            ) : (
              <div className={theme === "dark" ? "dark" : ""}>
                {/* Force light mode when theme is light, even if parent is dark */}
                <div 
                  className="flex items-center justify-center rounded-lg border border-border p-6 bg-background text-foreground"
                  style={theme === "light" ? {
                    colorScheme: "light",
                    // Override dark mode CSS variables with light mode values
                    backgroundColor: "#FAF9F7",
                    color: "#1C1917",
                    // Ensure child elements also use light mode
                    "--background": "#FAF9F7",
                    "--foreground": "#1C1917",
                    "--card": "#FFFFFF",
                    "--card-foreground": "#1C1917",
                    "--border": "#E7E5E4",
                    "--muted": "#F5F5F4",
                    "--muted-foreground": "#78716C",
                  } as React.CSSProperties & Record<string, string> : undefined}
                >
                  {(() => {
                    const status = getDeviceStatus({
                      lastReadingAt: device.lastReadingAt,
                      lastBattery: device.lastBattery,
                      providerOffline: device.providerOffline,
                      createdAt: device.createdAt,
                    });
                    const reading = status.isOnline ? latestReading ?? null : null;

                    if (style === "badge") {
                      if (size === "small") {
                        return (
                          <BadgeSmall
                            isOnline={status.isOnline}
                            pm25={reading?.pm25}
                            branding={previewBranding}
                          />
                        );
                      }
                      if (size === "large") {
                        return (
                          <BadgeLarge
                            title={previewTitle}
                            isOnline={status.isOnline}
                            pm25={reading?.pm25}
                            co2={reading?.co2}
                            branding={previewBranding}
                          />
                        );
                      }
                      return (
                        <BadgeMedium
                          title={previewTitle}
                          isOnline={status.isOnline}
                          pm25={reading?.pm25}
                          branding={previewBranding}
                        />
                      );
                    }

                    if (size === "small") {
                      return (
                        <CardSmall
                          title={previewTitle}
                          isOnline={status.isOnline}
                          pm25={reading?.pm25}
                          co2={reading?.co2}
                          branding={previewBranding}
                        />
                      );
                    }
                    if (size === "large") {
                      return (
                        <CardLarge
                          title={previewTitle}
                          isOnline={status.isOnline}
                          pm25={reading?.pm25}
                          co2={reading?.co2}
                          tempC={reading?.tempC}
                          rh={reading?.rh}
                          history={previewHistory.map((point) => ({
                            ts: point.ts,
                            pm25: point.pm25,
                          }))}
                          branding={previewBranding}
                        />
                      );
                    }
                    return (
                      <CardMedium
                        title={previewTitle}
                        isOnline={status.isOnline}
                        pm25={reading?.pm25}
                        co2={reading?.co2}
                        tempC={reading?.tempC}
                        rh={reading?.rh}
                        branding={previewBranding}
                      />
                    );
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
