"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DeviceCard } from "../../_components/DeviceCard";
import { useDashboardContext } from "../../_components/dashboard-context";

type PageProps = {
  params: Promise<{ deviceId: string }>;
};

export default function DeviceDetailPage({ params }: PageProps) {
  const { deviceId } = use(params);
  const { orgPlan } = useDashboardContext();
  
  const device = useQuery(api.devices.get, {
    deviceId: deviceId as Id<"devices">,
  });
  const reading = useQuery(api.readings.latest, {
    deviceId: deviceId as Id<"devices">,
  });

  if (device === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-slate-400">Loading device...</div>
      </div>
    );
  }

  if (device === null) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-slate-400">Device not found</p>
        <Link
          href="/dashboard"
          className="text-sm text-emerald-400 hover:text-emerald-300"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-300"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to dashboard
        </Link>
      </nav>

      {/* Device Card with all readings */}
      <DeviceCard device={device} reading={reading ?? null} userPlan={orgPlan} />
    </div>
  );
}
