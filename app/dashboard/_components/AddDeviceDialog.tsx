"use client";

import { Id } from "@/convex/_generated/dataModel";
import { ConnectDeviceDialog } from "./ConnectDeviceDialog";

type AddDeviceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: Id<"users">;
  organizationId: Id<"organizations">;
  maxDevices?: number;
  deviceCount?: number;
};

export function AddDeviceDialog({
  open,
  onOpenChange,
  userId,
  organizationId,
  maxDevices,
  deviceCount,
}: AddDeviceDialogProps) {
  return (
    <ConnectDeviceDialog
      open={open}
      onOpenChange={onOpenChange}
      userId={userId}
      organizationId={organizationId}
      maxDevices={maxDevices}
      deviceCount={deviceCount}
    />
  );
}
