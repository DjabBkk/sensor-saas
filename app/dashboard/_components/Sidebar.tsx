"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { useTheme } from "next-themes";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { getDeviceStatus, formatDuration } from "@/lib/deviceStatus";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Cpu,
  Settings,
  User,
  Plus,
  Wind,
  Monitor,
  Code,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
} from "lucide-react";

type Device = {
  _id: Id<"devices">;
  name: string;
  model?: string;
  roomId?: Id<"rooms">;
  lastReadingAt?: number;
  lastBattery?: number;
  providerOffline?: boolean;
  reportInterval?: number;
};

type Room = {
  _id: Id<"rooms">;
  name: string;
};

type SidebarProps = {
  devices: Device[];
  rooms: Room[];
  userId: Id<"users">;
  maxDevices: number;
  onAddDevice?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/devices", label: "Devices", icon: Cpu },
  { href: "/dashboard/kiosk", label: "Kiosk", icon: Monitor, comingSoon: true },
  { href: "/dashboard/widgets", label: "Widgets", icon: Code },
];

const bottomNavItems = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/account", label: "Account", icon: User },
];

export function Sidebar({
  devices,
  rooms,
  userId,
  maxDevices,
  onAddDevice,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const isAtDeviceLimit = devices.length >= maxDevices;

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
      <aside
        className={`flex flex-col border-r border-border bg-sidebar transition-all duration-200 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500">
            <Wind className="h-4 w-4 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-semibold text-foreground">AirView</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
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
                  className={`w-full justify-start gap-3 hover:bg-accent/60 ${
                    isCollapsed ? "px-2" : ""
                  }`}
                  size="sm"
                >
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && item.label}
                  {!isCollapsed && item.comingSoon ? (
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      Coming soon
                    </Badge>
                  ) : null}
                </Button>
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* Devices Section */}
        <div className="flex-1 overflow-y-auto p-3">
          {!isCollapsed && (
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Devices
              </span>
              <Badge
                variant="secondary"
                className={`text-xs ${isAtDeviceLimit ? "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400" : ""}`}
              >
                {devices.length}/{maxDevices}
              </Badge>
            </div>
          )}

          {devices.length === 0 ? (
            !isCollapsed && (
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
            )
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
                    {!isCollapsed && (
                      <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
                        {roomName}
                      </span>
                    )}
                    <div className="space-y-0.5">
                      {roomDevices.map((device) => (
                        <DeviceSidebarItem
                          key={device._id}
                          device={device}
                          isActive={isDeviceActive(device._id)}
                          isCollapsed={isCollapsed}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Device Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className={`w-full gap-2 hover:bg-accent/50 ${
                    isCollapsed ? "px-2" : ""
                  }`}
                  onClick={onAddDevice}
                  disabled={isAtDeviceLimit}
                >
                  <Plus className="h-4 w-4" />
                  {!isCollapsed && (isAtDeviceLimit ? "Sensor limit reached" : "Add Device")}
                </Button>
              </div>
            </TooltipTrigger>
            {isAtDeviceLimit && (
              <TooltipContent side="right">
                <p>Upgrade your plan to add more sensors</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        <Separator />

        {/* Theme Toggle */}
        <ThemeToggle isCollapsed={isCollapsed} />

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
                  className={`w-full justify-start gap-3 hover:bg-accent/60 ${
                    isCollapsed ? "px-2" : ""
                  }`}
                  size="sm"
                >
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}

// Theme Toggle Component
function ThemeToggle({ isCollapsed }: { isCollapsed: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isDark ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
        {!isCollapsed && <span>{isDark ? "Dark" : "Light"} Mode</span>}
      </div>
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle theme"
      />
    </div>
  );
}

// Separate component to use hooks inside map
function DeviceSidebarItem({
  device,
  isActive,
  isCollapsed,
}: {
  device: Device;
  isActive: boolean;
  isCollapsed: boolean;
}) {
  // Query latest reading to get most accurate status
  const reading = useQuery(api.readings.latest, {
    deviceId: device._id,
  });
  const lastReadingAt = reading?.ts ?? device.lastReadingAt;
  const status = getDeviceStatus({
    lastReadingAt,
    lastBattery: device.lastBattery,
    providerOffline: device.providerOffline,
    reportInterval: device.reportInterval,
    createdAt: device.createdAt,
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={`/dashboard/device/${device._id}`}>
          <Button
            variant={isActive ? "secondary" : "ghost"}
            size="sm"
            className="group w-full justify-start gap-2 text-left hover:bg-accent/60"
          >
            {/* Status dot - green: online, amber: overdue, red: confirmed offline */}
            <span
              className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                status.isOnline
                  ? "bg-emerald-500"
                  : status.isReadingOverdue && !status.isProviderOffline && !status.isBatteryEmpty
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              title={
                status.isOnline
                  ? "Online"
                  : status.isReadingOverdue
                    ? `No data for ${formatDuration(status.overdueMinutes)}`
                    : "Offline"
              }
            />
            {!isCollapsed && (
              <>
                <span className="flex-1 truncate text-xs">{device.name}</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </>
            )}
          </Button>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{device.model ?? "Qingping device"}</p>
        <p className="text-xs text-muted-foreground">
          {status.isOnline
            ? "Online"
            : status.isReadingOverdue
              ? `No data for ${formatDuration(status.overdueMinutes)}`
              : "Offline"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
