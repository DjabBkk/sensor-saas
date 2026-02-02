"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const STORAGE_KEY = "onboardingSelectedDeviceIds";

export default function OnboardingDevicesPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const devices = useQuery(
    api.devices.list,
    convexUserId ? { userId: convexUserId } : "skip",
  );

  const [selectedIds, setSelectedIds] = useState<Array<string>>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: Array<string> = JSON.parse(stored);
        setSelectedIds(parsed);
      } catch {
        setSelectedIds([]);
      }
    }
  }, []);

  const deviceList = useMemo(() => devices ?? [], [devices]);

  const toggleDevice = (deviceId: string) => {
    setSelectedIds((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId],
    );
  };

  const handleContinue = () => {
    if (selectedIds.length === 0) {
      setError("Select at least one device to continue.");
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
    router.push("/onboarding/rooms");
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Select Devices</h1>
        <p className="text-sm text-neutral-500">
          Choose which Qingping devices you want to import.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-col gap-3">
        {deviceList.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No devices found yet. Try syncing your Qingping account again.
          </p>
        ) : (
          deviceList.map((device) => (
            <label
              key={device._id}
              className="flex items-center gap-3 rounded border border-neutral-200 p-3"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(device._id)}
                onChange={() => toggleDevice(device._id)}
              />
              <div className="flex flex-col">
                <span className="font-medium">{device.name}</span>
                <span className="text-xs text-neutral-500">
                  {device.model ?? "Qingping device"}
                </span>
              </div>
            </label>
          ))
        )}
      </div>

      <button
        type="button"
        className="self-start rounded bg-black px-4 py-2 text-white"
        onClick={handleContinue}
      >
        Continue
      </button>
    </div>
  );
}
