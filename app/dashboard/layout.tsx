"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Sidebar } from "./_components/Sidebar";
import { AddDeviceDialog } from "./_components/AddDeviceDialog";
import { AddDeviceDialogProvider } from "./_components/add-device-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("airview.sidebar.collapsed");
    if (saved) {
      setIsSidebarCollapsed(saved === "true");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "airview.sidebar.collapsed",
      String(isSidebarCollapsed),
    );
  }, [isSidebarCollapsed]);

  const devices = useQuery(
    api.devices.list,
    convexUserId ? { userId: convexUserId } : "skip"
  );
  const rooms = useQuery(
    api.rooms.list,
    convexUserId ? { userId: convexUserId } : "skip"
  );

  if (!isLoaded || !convexUserId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <AddDeviceDialogProvider openDialog={() => setAddDeviceOpen(true)}>
      <div className="flex min-h-screen">
        <Sidebar
          devices={devices ?? []}
          rooms={rooms ?? []}
          userId={convexUserId}
          onAddDevice={() => setAddDeviceOpen(true)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
        <main className="flex-1 overflow-auto">{children}</main>
        <AddDeviceDialog
          open={addDeviceOpen}
          onOpenChange={setAddDeviceOpen}
          userId={convexUserId}
        />
      </div>
    </AddDeviceDialogProvider>
  );
}
