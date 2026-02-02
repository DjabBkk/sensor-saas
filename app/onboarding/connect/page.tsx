"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Key, ExternalLink, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ConnectProviderPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const connectProvider = useMutation(api.providers.connect);

  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const [appKey, setAppKey] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    if (!userId) {
      router.replace("/login");
      return;
    }
    if (convexUserId || !user) {
      return;
    }
    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) {
      setError("No email address found for this user.");
      return;
    }

    let cancelled = false;
    getOrCreateUser({
      authId: userId,
      email,
      name: user.fullName ?? undefined,
    })
      .then((id) => {
        if (!cancelled) {
          setConvexUserId(id);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to sync user.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, user, convexUserId, getOrCreateUser, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!convexUserId) {
      setError("User sync not ready yet. Please wait.");
      return;
    }
    if (!appKey || !appSecret) {
      setError("App Key and App Secret are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await connectProvider({
        userId: convexUserId,
        provider: "qingping",
        appKey: appKey.trim(),
        appSecret: appSecret.trim(),
      });
      router.push("/onboarding/devices");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect Qingping. Please check your credentials.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 p-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/onboarding/instructions" className="hover:text-foreground">
          Setup Guide
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Add Credentials</span>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Connect Your Qingping Account</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your Qingping Developer Platform credentials to sync your devices.
          </p>
        </div>

        {/* Instructions Card */}
        <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Where to Find Your Credentials
            </CardTitle>
            <CardDescription>
              Follow these steps if you haven't retrieved your App Key and App Secret yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-medium">Step 1:</span> Create a developer account at{" "}
                <a
                  href="https://developer.cleargrass.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  developer.cleargrass.com
                  <ExternalLink className="ml-1 inline h-3 w-3" />
                </a>
                {" "}using the <strong>same credentials</strong> as your Qingping+ app account
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-medium">Step 2:</span> Go to "Developer Information
                Management" section
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-medium">Step 3:</span> Copy your App Key and App Secret
              </div>
            </div>
            <div className="mt-4">
              <Link href="/onboarding/instructions">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  View Full Setup Guide
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Enter Your Credentials</CardTitle>
            <CardDescription>
              Your credentials are stored securely and only used to access your devices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appKey">App Key</Label>
                <Input
                  id="appKey"
                  placeholder="Enter your App Key"
                  value={appKey}
                  onChange={(e) => setAppKey(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="appSecret">App Secret</Label>
                <Input
                  id="appSecret"
                  type="password"
                  placeholder="Enter your App Secret"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Your credentials are encrypted and stored securely.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect & Sync Devices"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
