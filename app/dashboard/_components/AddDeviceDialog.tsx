"use client";

import { Id } from "@/convex/_generated/dataModel";
import { ConnectDeviceDialog } from "./ConnectDeviceDialog";

type AddDeviceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: Id<"users">;
};

export function AddDeviceDialog({
  open,
  onOpenChange,
  userId,
}: AddDeviceDialogProps) {
  return (
    <ConnectDeviceDialog
      open={open}
      onOpenChange={onOpenChange}
      userId={userId}
    />
  );
}
