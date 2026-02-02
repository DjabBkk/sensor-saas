"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

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
        appKey,
        appSecret,
      });
      router.push("/onboarding/devices");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect Qingping.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Connect Qingping</h1>
        <p className="text-sm text-neutral-500">
          Enter your Qingping App Key and App Secret to link your devices.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm">
          App Key
          <input
            className="rounded border border-neutral-300 px-3 py-2"
            value={appKey}
            onChange={(event) => setAppKey(event.target.value)}
            placeholder="Your Qingping App Key"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          App Secret
          <input
            className="rounded border border-neutral-300 px-3 py-2"
            type="password"
            value={appSecret}
            onChange={(event) => setAppSecret(event.target.value)}
            placeholder="Your Qingping App Secret"
            required
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Connecting..." : "Connect Qingping"}
        </button>
      </form>
    </div>
  );
}
