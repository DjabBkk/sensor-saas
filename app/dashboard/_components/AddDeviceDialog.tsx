"use client";

import { useState } from "react";
import { useMutation } from "convex/react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

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
  const [deviceName, setDeviceName] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addDevice = useMutation(api.devices.addByMac);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!deviceName.trim()) {
      setError("Please enter a device name");
      return;
    }

    if (!macAddress.trim()) {
      setError("Please enter a MAC address");
      return;
    }

    // Normalize MAC address - remove colons/dashes and uppercase
    const normalizedMac = macAddress
      .replace(/[:\-\s]/g, "")
      .toUpperCase();

    if (!/^[A-F0-9]{12}$/.test(normalizedMac)) {
      setError("Invalid MAC address format. Example: CC:B5:D1:32:36:8B");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDevice({
        userId,
        name: deviceName.trim(),
        macAddress: normalizedMac,
        provider: "qingping",
      });
      setDeviceName("");
      setMacAddress("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add device");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Device</DialogTitle>
          <DialogDescription>
            Enter the MAC address from your Qingping+ app to add a device.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="deviceName">Device Name</Label>
              <Input
                id="deviceName"
                placeholder="e.g., Living Room Monitor"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="macAddress">MAC Address</Label>
              <Input
                id="macAddress"
                placeholder="e.g., CC:B5:D1:32:36:8B"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Find this in Qingping+ App → Device → About
              </p>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Device
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
