"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const STORAGE_KEY = "onboardingSelectedDeviceIds";

type DeviceAssignment = {
  deviceId: Id<"devices">;
  roomId?: Id<"rooms">;
};

export default function OnboardingRoomsPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const createRoom = useMutation(api.rooms.create);
  const updateRoom = useMutation(api.devices.updateRoom);

  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Array<Id<"devices">>>(
    [],
  );
  const [assignments, setAssignments] = useState<Array<DeviceAssignment>>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      router.replace("/onboarding/devices");
      return;
    }
    try {
      const parsed: Array<Id<"devices">> = JSON.parse(stored);
      setSelectedDeviceIds(parsed);
    } catch {
      router.replace("/onboarding/devices");
    }
  }, [router]);

  const devices = useQuery(
    api.devices.list,
    convexUserId ? { userId: convexUserId } : "skip",
  );
  const rooms = useQuery(
    api.rooms.list,
    convexUserId ? { userId: convexUserId } : "skip",
  );

  const selectedDevices = useMemo(() => {
    if (!devices) {
      return [];
    }
    return devices.filter((device) => selectedDeviceIds.includes(device._id));
  }, [devices, selectedDeviceIds]);

  useEffect(() => {
    setAssignments((prev) =>
      selectedDevices.map((device) => {
        const existing = prev.find((item) => item.deviceId === device._id);
        return {
          deviceId: device._id,
          roomId: existing?.roomId,
        };
      }),
    );
  }, [selectedDevices]);

  const handleAssignmentChange = (
    deviceId: Id<"devices">,
    roomId?: Id<"rooms">,
  ) => {
    setAssignments((prev) =>
      prev.map((item) =>
        item.deviceId === deviceId ? { ...item, roomId } : item,
      ),
    );
  };

  const handleCreateRoom = async () => {
    setError(null);
    if (!convexUserId) {
      setError("User sync not ready yet. Please wait.");
      return;
    }
    if (!newRoomName.trim()) {
      setError("Room name is required.");
      return;
    }
    try {
      await createRoom({ userId: convexUserId, name: newRoomName.trim() });
      setNewRoomName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room.");
    }
  };

  const handleContinue = async () => {
    setError(null);
    setIsSaving(true);
    try {
      for (const assignment of assignments) {
        await updateRoom({
          deviceId: assignment.deviceId,
          roomId: assignment.roomId,
        });
      }
      router.push("/onboarding/complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign rooms.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Assign Rooms</h1>
        <p className="text-sm text-neutral-500">
          Optionally assign each device to a room.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-col gap-3">
        {selectedDevices.length === 0 ? (
          <p className="text-sm text-neutral-500">No devices selected.</p>
        ) : (
          selectedDevices.map((device) => (
            <div
              key={device._id}
              className="flex flex-col gap-2 rounded border border-neutral-200 p-3"
            >
              <div className="font-medium">{device.name}</div>
              <select
                className="rounded border border-neutral-300 px-3 py-2 text-sm"
                value={
                  assignments.find((item) => item.deviceId === device._id)
                    ?.roomId ?? ""
                }
                onChange={(event) =>
                  handleAssignmentChange(
                    device._id,
                    event.target.value
                      ? (event.target.value as Id<"rooms">)
                      : undefined,
                  )
                }
              >
                <option value="">No room</option>
                {(rooms ?? []).map((room) => (
                  <option key={room._id} value={room._id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-3 rounded border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold">Create a new room</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm"
            placeholder="Room name"
            value={newRoomName}
            onChange={(event) => setNewRoomName(event.target.value)}
          />
          <button
            type="button"
            className="rounded bg-neutral-900 px-4 py-2 text-sm text-white"
            onClick={handleCreateRoom}
          >
            Add room
          </button>
        </div>
      </div>

      <button
        type="button"
        className="self-start rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        onClick={handleContinue}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Continue"}
      </button>
    </div>
  );
}
