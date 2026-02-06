"use client";

import { createContext, useContext } from "react";
import { Id } from "@/convex/_generated/dataModel";
import type { Plan } from "@/convex/lib/planLimits";

type DashboardContextValue = {
  convexUserId: Id<"users">;
  organizationId: Id<"organizations">;
  orgPlan: Plan;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  children,
  convexUserId,
  organizationId,
  orgPlan,
}: {
  children: React.ReactNode;
  convexUserId: Id<"users">;
  organizationId: Id<"organizations">;
  orgPlan: Plan;
}) {
  return (
    <DashboardContext.Provider value={{ convexUserId, organizationId, orgPlan }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error(
      "useDashboardContext must be used within DashboardProvider",
    );
  }
  return context;
}
