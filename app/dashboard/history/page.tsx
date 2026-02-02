"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const TIME_RANGES = [
  { label: "Last 24 hours", value: "24h", ms: 24 * 60 * 60 * 1000 },
  { label: "Last 7 days", value: "7d", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "Last 30 days", value: "30d", ms: 30 * 24 * 60 * 60 * 1000 },
];

export default function HistoryPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("24h");
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!isLoaded || !userId || convexUserId || !user) return;

    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) return;

    getOrCreateUser({
      authId: userId,
      email,
      name: user.fullName ?? undefined,
    })
      .then(setConvexUserId)
      .catch(console.error);
  }, [isLoaded, userId, user, convexUserId, getOrCreateUser]);

  const devices = useQuery(
    api.devices.list,
    convexUserId ? { userId: convexUserId } : "skip"
  );

  // Auto-select first device only once when devices load
  useEffect(() => {
    if (hasInitialized.current) return;
    if (!devices || devices.length === 0) return;
    
    const firstDevice = devices[0];
    if (firstDevice) {
      setSelectedDeviceId(firstDevice._id);
      hasInitialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices]);

  const selectedRange = TIME_RANGES.find((r) => r.value === timeRange);
  
  // Memoize startTs to prevent infinite re-renders from Date.now() changing
  const startTs = useMemo(() => {
    return Date.now() - (selectedRange?.ms ?? 24 * 60 * 60 * 1000);
  }, [selectedRange?.ms]);

  const readings = useQuery(
    api.readings.history,
    selectedDeviceId
      ? {
          deviceId: selectedDeviceId as Id<"devices">,
          startTs,
          limit: 500,
        }
      : "skip"
  );

  const chartData = useMemo(() => {
    if (!readings) return [];
    return readings
      .slice()
      .reverse()
      .map((r) => ({
        time: new Date(r.ts * 1000).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: r.ts,
        pm25: r.pm25,
        pm10: r.pm10,
        co2: r.co2,
        tempC: r.tempC,
        rh: r.rh,
      }));
  }, [readings]);

  if (!convexUserId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">History</h1>
          <p className="text-muted-foreground">
            View historical readings from your devices
          </p>
        </div>
        <div className="flex gap-3">
          {/* Device Selector */}
          <Select
            value={selectedDeviceId ?? undefined}
            onValueChange={setSelectedDeviceId}
          >
            <SelectTrigger className="w-[200px]">
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

          {/* Time Range */}
          <div className="flex gap-1 rounded-lg border border-border p-1">
            {TIME_RANGES.map((range) => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(range.value)}
              >
                {range.label.replace("Last ", "")}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {!selectedDeviceId ? (
        <Card>
          <CardContent className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground">
              Select a device to view history
            </p>
          </CardContent>
        </Card>
      ) : chartData.length === 0 ? (
        <Card>
          <CardContent className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground">
              No data available for this time range
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="air-quality" className="space-y-4">
          <TabsList>
            <TabsTrigger value="air-quality">Air Quality</TabsTrigger>
            <TabsTrigger value="climate">Climate</TabsTrigger>
          </TabsList>

          <TabsContent value="air-quality" className="space-y-4">
            {/* PM2.5 Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">PM2.5 Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="pm25Gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="time"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="pm25"
                        stroke="hsl(var(--chart-1))"
                        fill="url(#pm25Gradient)"
                        strokeWidth={2}
                        name="PM2.5 (µg/m³)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* CO2 Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">CO₂ Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="co2Gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="time"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="co2"
                        stroke="hsl(var(--chart-2))"
                        fill="url(#co2Gradient)"
                        strokeWidth={2}
                        name="CO₂ (ppm)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="climate" className="space-y-4">
            {/* Temperature & Humidity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Temperature & Humidity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="time"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="temp"
                        stroke="hsl(var(--chart-3))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}°C`}
                      />
                      <YAxis
                        yAxisId="humidity"
                        orientation="right"
                        stroke="hsl(var(--chart-4))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Line
                        yAxisId="temp"
                        type="monotone"
                        dataKey="tempC"
                        stroke="hsl(var(--chart-3))"
                        strokeWidth={2}
                        dot={false}
                        name="Temperature (°C)"
                      />
                      <Line
                        yAxisId="humidity"
                        type="monotone"
                        dataKey="rh"
                        stroke="hsl(var(--chart-4))"
                        strokeWidth={2}
                        dot={false}
                        name="Humidity (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
