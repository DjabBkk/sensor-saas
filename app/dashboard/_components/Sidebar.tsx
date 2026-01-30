"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

type Device = {
  _id: Id<"devices">;
  name: string;
  model?: string;
  roomId?: Id<"rooms">;
  lastReadingAt?: number;
};

type Room = {
  _id: Id<"rooms">;
  name: string;
};

type SidebarProps = {
  devices: Device[];
  rooms: Room[];
  userId: Id<"users">;
};

export function Sidebar({ devices, rooms, userId }: SidebarProps) {
  const pathname = usePathname();

  // Group devices by room
  const devicesByRoom = devices.reduce(
    (acc, device) => {
      const roomId = device.roomId ?? "unassigned";
      if (!acc[roomId]) acc[roomId] = [];
      acc[roomId].push(device);
      return acc;
    },
    {} as Record<string, Device[]>
  );

  const roomMap = rooms.reduce(
    (acc, room) => {
      acc[room._id] = room.name;
      return acc;
    },
    {} as Record<string, string>
  );

  const sortedRoomIds = [
    ...rooms.map((r) => r._id as string),
    ...(devicesByRoom["unassigned"] ? ["unassigned"] : []),
  ];

  const isActive = (deviceId: string) =>
    pathname === `/dashboard/device/${deviceId}`;

  return (
    <aside className="flex w-72 flex-col border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      {/* Header */}
      <div className="border-b border-slate-800 p-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500">
            <svg
              className="h-5 w-5 text-slate-900"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
              />
            </svg>
          </div>
          <div>
            <h1 className="font-semibold text-slate-100">AirView</h1>
            <p className="text-xs text-slate-500">Air Quality Monitor</p>
          </div>
        </Link>
      </div>

      {/* Devices */}
      <nav className="flex-1 overflow-y-auto p-4">
        {devices.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 p-4 text-center">
            <p className="text-sm text-slate-500">No devices connected</p>
            <Link
              href="/onboarding/connect"
              className="mt-2 inline-block text-sm text-emerald-400 hover:text-emerald-300"
            >
              Connect a device →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedRoomIds.map((roomId) => {
              const roomDevices = devicesByRoom[roomId];
              if (!roomDevices?.length) return null;

              const roomName =
                roomId === "unassigned"
                  ? "Unassigned"
                  : roomMap[roomId] ?? "Unknown Room";

              return (
                <div key={roomId}>
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                    <span className="h-px flex-1 bg-slate-800" />
                    {roomName}
                    <span className="h-px flex-1 bg-slate-800" />
                  </h3>
                  <ul className="space-y-1">
                    {roomDevices.map((device) => (
                      <li key={device._id}>
                        <Link
                          href={`/dashboard/device/${device._id}`}
                          className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                            isActive(device._id)
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              device.lastReadingAt &&
                              Date.now() - device.lastReadingAt < 30 * 60 * 1000
                                ? "bg-emerald-400 shadow-lg shadow-emerald-400/50"
                                : "bg-slate-600"
                            }`}
                          />
                          <div className="flex-1 truncate">
                            <p className="truncate text-sm font-medium">
                              {device.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {device.model ?? "Qingping"}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-4">
        <Link
          href="/onboarding/connect"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Device
        </Link>
      </div>
    </aside>
  );
}
