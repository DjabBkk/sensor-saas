"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  History,
  Settings,
  User,
  Plus,
  Wind,
  Wifi,
  WifiOff,
  Monitor,
  Code,
} from "lucide-react";

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
  onAddDevice?: () => void;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/kiosk", label: "Kiosk", icon: Monitor },
  { href: "/dashboard/widgets", label: "Widgets", icon: Code },
];

const bottomNavItems = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/account", label: "Account", icon: User },
];

export function Sidebar({ devices, rooms, userId, onAddDevice }: SidebarProps) {
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

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const isDeviceActive = (deviceId: string) =>
    pathname === `/dashboard/device/${deviceId}`;

  return (
    <TooltipProvider>
      <aside className="flex w-64 flex-col border-r border-border bg-sidebar">
        {/* Logo */}
        <div className="flex h-14 items-center gap-3 border-b border-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500">
            <Wind className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-foreground">AirView</span>
        </div>

        {/* Main Navigation */}
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={active ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                  size="sm"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* Devices Section */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Devices
            </span>
            <Badge variant="secondary" className="text-xs">
              {devices.length}
            </Badge>
          </div>

          {devices.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">No devices yet</p>
              <Button
                variant="link"
                size="sm"
                className="mt-1 h-auto p-0 text-xs"
                onClick={onAddDevice}
              >
                Add your first device
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedRoomIds.map((roomId) => {
                const roomDevices = devicesByRoom[roomId];
                if (!roomDevices?.length) return null;

                const roomName =
                  roomId === "unassigned"
                    ? "Unassigned"
                    : roomMap[roomId] ?? "Unknown";

                return (
                  <div key={roomId}>
                    <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
                      {roomName}
                    </span>
                    <div className="space-y-0.5">
                      {roomDevices.map((device) => {
                        const isOnline =
                          device.lastReadingAt &&
                          Date.now() - device.lastReadingAt < 30 * 60 * 1000;
                        const active = isDeviceActive(device._id);

                        return (
                          <Tooltip key={device._id}>
                            <TooltipTrigger asChild>
                              <Link href={`/dashboard/device/${device._id}`}>
                                <Button
                                  variant={active ? "secondary" : "ghost"}
                                  size="sm"
                                  className="w-full justify-start gap-2 text-left"
                                >
                                  {isOnline ? (
                                    <Wifi className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <WifiOff className="h-3 w-3 text-muted-foreground" />
                                  )}
                                  <span className="flex-1 truncate text-xs">
                                    {device.name}
                                  </span>
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p>{device.model ?? "Qingping device"}</p>
                              <p className="text-xs text-muted-foreground">
                                {isOnline ? "Online" : "Offline"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Device Button */}
          <Button
            variant="outline"
            size="sm"
            className="mt-4 w-full gap-2"
            onClick={onAddDevice}
          >
            <Plus className="h-4 w-4" />
            Add Device
          </Button>
        </div>

        <Separator />

        {/* Bottom Navigation */}
        <nav className="flex flex-col gap-1 p-3">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={active ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                  size="sm"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* User Profile */}
        <div className="flex items-center gap-3 p-4">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium text-foreground">
              My Account
            </p>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
