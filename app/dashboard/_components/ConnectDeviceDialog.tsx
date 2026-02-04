"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

type ConnectDeviceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: Id<"users">;
};

type QingpingStepKey =
  | "download"
  | "onboard"
  | "developer"
  | "keys"
  | "credentials"
  | "device";

const brandCards = [
  { id: "qingping", label: "Qingping", status: "available" as const },
  { id: "iqair", label: "IQAir", status: "coming" as const },
  { id: "kaiterra", label: "Kaiterra", status: "coming" as const },
  { id: "airthings", label: "Airthings", status: "coming" as const },
  { id: "purpleair", label: "PurpleAir", status: "coming" as const },
];

export function ConnectDeviceDialog({
  open,
  onOpenChange,
  userId,
}: ConnectDeviceDialogProps) {
  const hasQingpingCredentials = useQuery(
    api.providers.hasProviderCredentials,
    open ? { userId, provider: "qingping" } : "skip",
  );
  const hasQingpingDevice = useQuery(
    api.devices.hasQingpingDevice,
    open ? { userId } : "skip",
  );
  const connectProvider = useMutation(api.providers.connect);
  const addDevice = useMutation(api.devices.addByMac);

  const [isBrandStep, setIsBrandStep] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [appKey, setAppKey] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const qingpingSteps = useMemo<QingpingStepKey[]>(() => {
    const hasCredentials = Boolean(hasQingpingCredentials);
    const hasDevice = Boolean(hasQingpingDevice);
    if (hasCredentials && hasDevice) {
      return ["device"];
    }
    return [
      "download",
      "onboard",
      "developer",
      "keys",
      "credentials",
      "device",
    ];
  }, [hasQingpingCredentials, hasQingpingDevice]);

  const currentStep = qingpingSteps[stepIndex];

  useEffect(() => {
    if (!open) {
      setIsBrandStep(true);
      setStepIndex(0);
      setAppKey("");
      setAppSecret("");
      setMacAddress("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (isBrandStep) {
      return;
    }
    if (stepIndex >= qingpingSteps.length) {
      setStepIndex(0);
    }
  }, [isBrandStep, qingpingSteps.length, stepIndex]);

  const goToBrandStep = () => {
    setIsBrandStep(true);
    setStepIndex(0);
    setError(null);
  };

  const handleSelectQingping = () => {
    setIsBrandStep(false);
    setStepIndex(0);
    setError(null);
  };

  const handleBack = () => {
    if (isBrandStep) {
      return;
    }
    if (stepIndex === 0) {
      goToBrandStep();
      return;
    }
    setStepIndex((prev) => Math.max(prev - 1, 0));
    setError(null);
  };

  const handleNext = () => {
    setError(null);
    if (currentStep === "credentials") {
      if (!hasQingpingCredentials && (!appKey.trim() || !appSecret.trim())) {
        setError("Enter both API keys.");
        return;
      }
    }
    if (stepIndex < qingpingSteps.length - 1) {
      setStepIndex((prev) => prev + 1);
    }
  };

  const handleSubmitDevice = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!macAddress.trim()) {
      setError("Enter a MAC address.");
      return;
    }

    const normalizedMac = macAddress.replace(/[:\-\s]/g, "").toUpperCase();
    if (!/^[A-F0-9]{12}$/.test(normalizedMac)) {
      setError("Invalid MAC address format.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!hasQingpingCredentials) {
        await connectProvider({
          userId,
          provider: "qingping",
          appKey: appKey.trim(),
          appSecret: appSecret.trim(),
        });
      }

      await addDevice({
        userId,
        macAddress: normalizedMac,
        provider: "qingping",
      });

      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add device.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {isBrandStep ? (
          <>
            <DialogHeader>
              <DialogTitle>Connect a device</DialogTitle>
              <DialogDescription>
                Choose a brand. More coming soon.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              {brandCards.map((brand) => {
                const isAvailable = brand.status === "available";
                return (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={isAvailable ? handleSelectQingping : undefined}
                    disabled={!isAvailable}
                    className={`rounded-lg border px-4 py-3 text-left transition ${
                      isAvailable
                        ? "border-primary/40 bg-primary/5 hover:border-primary"
                        : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">
                          {brand.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {isAvailable ? "Available now" : "Coming soon"}
                        </div>
                      </div>
                      {!isAvailable && (
                        <Badge variant="secondary" className="text-[10px]">
                          Coming soon
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Qingping setup</DialogTitle>
              <DialogDescription>
                Step {stepIndex + 1} of {qingpingSteps.length}
              </DialogDescription>
            </DialogHeader>

            {currentStep === "download" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Download Qingping+
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Install the Qingping+ app.
                </CardContent>
              </Card>
            )}

            {currentStep === "onboard" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Onboard sensor</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Add your sensor in the Qingping+ app.
                </CardContent>
              </Card>
            )}

            {currentStep === "developer" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Create developer account
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  After signing up to the Qingping+ App a developer account at https://developer.qingping.co/login was automatically created. 
                  Login in with the same credentials as the Qingping+ App.
                </CardContent>
              </Card>
            )}

            {currentStep === "keys" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Get API keys</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  In the developer dashboard, click your email → Access
                  Management. Copy App Key + App Secret.
                </CardContent>
              </Card>
            )}

            {currentStep === "credentials" && (
              <form className="grid gap-4">
                {hasQingpingCredentials ? (
                  <p className="text-sm text-muted-foreground">
                    API keys already saved. Continue to add the device.
                  </p>
                ) : (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="appKey">App Key</Label>
                      <Input
                        id="appKey"
                        value={appKey}
                        onChange={(e) => setAppKey(e.target.value)}
                        placeholder="App Key"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="appSecret">App Secret</Label>
                      <Input
                        id="appSecret"
                        type="password"
                        value={appSecret}
                        onChange={(e) => setAppSecret(e.target.value)}
                        placeholder="App Secret"
                      />
                    </div>
                  </>
                )}
              </form>
            )}

            {currentStep === "device" && (
              <form onSubmit={handleSubmitDevice} className="grid gap-4">
                <p className="text-sm text-muted-foreground">
                  Enter the MAC address of your device. You can find it in the Qingping+ app under device settings.
                  The device name will be synced from your Qingping+ app.
                </p>
                <div className="grid gap-2">
                  <Label htmlFor="macAddress">MAC address</Label>
                  <Input
                    id="macAddress"
                    value={macAddress}
                    onChange={(e) => setMacAddress(e.target.value)}
                    placeholder="CC:B5:D1:32:36:8B"
                    className="font-mono"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add device
                  </Button>
                </DialogFooter>
              </form>
            )}

            {currentStep !== "device" && (
              <DialogFooter>
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleNext}>Continue</Button>
              </DialogFooter>
            )}

            {error && currentStep !== "device" && (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
