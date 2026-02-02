"use client";

import { useEffect, useMemo, useState, use } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";

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

type EmbedStyle = "badge" | "card" | "full";
type EmbedTheme = "light" | "dark";

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

  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const [label, setLabel] = useState("");
  const [style, setStyle] = useState<EmbedStyle>("card");
  const [theme, setTheme] = useState<EmbedTheme>("dark");
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
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

  const device = useQuery(api.devices.get, { deviceId: deviceId as Id<"devices"> });
  const tokens = useQuery(api.embedTokens.listForDevice, {
    deviceId: deviceId as Id<"devices">,
  });

  const activeTokens = useMemo(
    () => (tokens ?? []).filter((token) => !token.isRevoked),
    [tokens],
  );

  useEffect(() => {
    if (activeTokens.length && !selectedTokenId) {
      setSelectedTokenId(activeTokens[0]._id);
    }
  }, [activeTokens, selectedTokenId]);

  const selectedToken = activeTokens.find((token) => token._id === selectedTokenId);
  const embedUrl = selectedToken
    ? `${origin}/embed/${style}/${selectedToken.token}?theme=${theme}`
    : "";

  const iframeSnippet = embedUrl
    ? `<iframe src="${embedUrl}" width="320" height="200" frameborder="0"></iframe>`
    : "";

  const scriptSnippet = selectedToken
    ? `<div id="airview-widget" data-token="${selectedToken.token}" data-style="${style}" data-theme="${theme}"></div>
<script src="${origin}/embed.js"></script>`
    : "";

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
      });
      setLabel("");
      setSelectedTokenId(created._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create token.");
    }
  };

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

      <Card>
        <CardHeader>
          <CardTitle>Create an embed token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Label (optional)</Label>
            <Input
              id="label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Lobby screen, Website badge, etc."
            />
          </div>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <Button onClick={handleCreate}>Create Token</Button>
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
          <div className="grid gap-4 md:grid-cols-3">
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
                  <SelectItem value="full">Full</SelectItem>
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
    </div>
  );
}
