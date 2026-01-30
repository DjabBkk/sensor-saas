"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getPM25Level, getCO2Level } from "./_components/ReadingGauge";

export default function DashboardPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);

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

  const devices = useQuery(
    api.devices.list,
    convexUserId ? { userId: convexUserId } : "skip"
  );

  if (!convexUserId) {
    return null;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
        <p className="mt-1 text-slate-500">
          Overview of your air quality monitors
        </p>
      </div>

      {/* Empty State */}
      {devices?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 px-8 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-500/20">
            <svg
              className="h-8 w-8 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-200">
            No devices connected
          </h2>
          <p className="mt-2 max-w-sm text-slate-500">
            Connect your first Qingping air quality monitor to start tracking
            your indoor air quality.
          </p>
          <Link
            href="/onboarding/connect"
            className="mt-6 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 font-medium text-white transition-all hover:from-emerald-400 hover:to-cyan-400"
          >
            Connect Device
          </Link>
        </div>
      )}

      {/* Device Grid */}
      {devices && devices.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {devices.map((device) => (
            <DeviceOverviewCard key={device._id} device={device} />
          ))}
        </div>
      )}
    </div>
  );
}

// Mini device card for the overview
function DeviceOverviewCard({
  device,
}: {
  device: {
    _id: Id<"devices">;
    name: string;
    model?: string;
    lastReadingAt?: number;
  };
}) {
  const reading = useQuery(api.readings.latest, { deviceId: device._id });

  const pm25Level = reading?.pm25 !== undefined ? getPM25Level(reading.pm25) : null;
  const co2Level = reading?.co2 !== undefined ? getCO2Level(reading.co2) : null;

  const isOnline =
    device.lastReadingAt && Date.now() - device.lastReadingAt < 30 * 60 * 1000;

  return (
    <Link
      href={`/dashboard/device/${device._id}`}
      className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/50 p-6 transition-all hover:border-slate-700 hover:shadow-xl hover:shadow-slate-900/50"
    >
      {/* Background gradient based on air quality */}
      {pm25Level && (
        <div
          className={`absolute -right-16 -top-16 h-48 w-48 rounded-full ${pm25Level.bgColor} opacity-5 blur-3xl transition-opacity group-hover:opacity-10`}
        />
      )}

      <div className="relative">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-slate-100 group-hover:text-white">
              {device.name}
            </h3>
            <p className="text-xs text-slate-500">
              {device.model ?? "Qingping"}
            </p>
          </div>
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isOnline
                ? "bg-emerald-400 shadow-lg shadow-emerald-400/50"
                : "bg-slate-600"
            }`}
          />
        </div>

        {/* Key Metrics */}
        {reading ? (
          <div className="grid grid-cols-2 gap-4">
            {/* PM2.5 */}
            <div>
              <p className="text-xs text-slate-500">PM2.5</p>
              <p className={`text-2xl font-bold ${pm25Level?.color ?? "text-slate-100"}`}>
                {reading.pm25 ?? "--"}
                <span className="ml-1 text-sm font-normal text-slate-500">
                  µg/m³
                </span>
              </p>
            </div>
            {/* CO2 */}
            <div>
              <p className="text-xs text-slate-500">CO₂</p>
              <p className={`text-2xl font-bold ${co2Level?.color ?? "text-slate-100"}`}>
                {reading.co2 ?? "--"}
                <span className="ml-1 text-sm font-normal text-slate-500">
                  ppm
                </span>
              </p>
            </div>
            {/* Temperature */}
            <div>
              <p className="text-xs text-slate-500">Temp</p>
              <p className="text-lg font-semibold text-slate-300">
                {reading.tempC !== undefined ? `${reading.tempC}°C` : "--"}
              </p>
            </div>
            {/* Humidity */}
            <div>
              <p className="text-xs text-slate-500">Humidity</p>
              <p className="text-lg font-semibold text-slate-300">
                {reading.rh !== undefined ? `${reading.rh}%` : "--"}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-slate-500">
            No readings yet
          </div>
        )}

        {/* View Details Arrow */}
        <div className="mt-4 flex items-center justify-end text-xs text-slate-500 group-hover:text-emerald-400">
          View details
          <svg
            className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
