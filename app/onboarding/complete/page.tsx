"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "onboardingSelectedDeviceIds";

export default function OnboardingCompletePage() {
  const [deviceCount, setDeviceCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: Array<string> = JSON.parse(stored);
        setDeviceCount(parsed.length);
      } catch {
        setDeviceCount(0);
      }
    }
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 p-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold">All set!</h1>
        <p className="text-sm text-neutral-500">
          {deviceCount > 0
            ? `${deviceCount} device${deviceCount === 1 ? "" : "s"} imported.`
            : "Your devices are ready to go."}
        </p>
      </div>

      <Link
        href="/dashboard"
        className="rounded bg-black px-4 py-2 text-white"
      >
        Go to dashboard
      </Link>
    </div>
  );
}
