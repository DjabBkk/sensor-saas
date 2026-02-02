"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Smartphone, Key, Wifi } from "lucide-react";

export default function Home() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && userId) {
      router.push("/dashboard");
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
              <Wifi className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold">Sensor Dashboard</span>
          </div>
          <Link href="/login">
            <Button variant="outline">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto flex max-w-7xl flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl md:text-6xl">
            Monitor Your Air Quality
            <br />
            <span className="text-emerald-600 dark:text-emerald-400">
              With Qingping Sensors
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">
            Connect your Qingping air quality monitors and track PM2.5, CO₂,
            temperature, humidity, and more in real-time.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/onboarding/instructions">
              <Button size="lg" variant="outline">
                View Setup Guide
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid w-full max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Smartphone className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Easy Setup
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Connect your Qingping devices in minutes with our step-by-step
              guide.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Key className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Secure Access
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Your data is secure with encrypted connections and user-specific
              credentials.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <CheckCircle2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Real-Time Data
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Monitor your air quality with live updates every 5 minutes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
