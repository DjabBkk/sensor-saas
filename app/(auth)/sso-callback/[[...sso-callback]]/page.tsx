"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2, Wind } from "lucide-react";

export default function SsoCallbackPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-xl border border-border/50 bg-background/80 p-8 text-center shadow-xl backdrop-blur-lg">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 shadow-lg shadow-primary/25">
            <Wind className="h-6 w-6 text-white" />
            <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Completing sign in</h1>
            <p className="text-sm text-muted-foreground">
              Please wait while we connect your account...
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecting...
          </div>
        </div>
      </div>

      <AuthenticateWithRedirectCallback />
    </div>
  );
}
