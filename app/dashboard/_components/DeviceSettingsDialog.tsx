"use client";

import { useEffect, useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";

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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

type DeviceSettingsDialogProps = {
  deviceId: Id<"devices">;
  deviceName: string;
  hiddenMetrics?: string[];
  availableMetrics?: string[];
  trigger: React.ReactNode;
};

const METRIC_OPTIONS = [
  { key: "pm25", label: "PM2.5" },
  { key: "co2", label: "CO₂" },
  { key: "temperature", label: "Temperature" },
  { key: "humidity", label: "Humidity" },
  { key: "pm10", label: "PM10" },
  { key: "voc", label: "TVOC" },
  { key: "battery", label: "Battery" },
];

export function DeviceSettingsDialog({
  deviceId,
  deviceName,
  hiddenMetrics,
  availableMetrics,
  trigger,
}: DeviceSettingsDialogProps) {
  const router = useRouter();
  const updateHiddenMetrics = useMutation(api.devices.updateHiddenMetrics);
  const renameDevice = useMutation(api.devices.rename);
  const deleteDevice = useMutation(api.devices.deleteDevice);
  const updateReportInterval = useAction(api.providersActions.updateDeviceReportInterval);
  
  // Get device info to check provider and get userId
  const device = useQuery(api.devices.get, { deviceId });

  const [open, setOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(deviceName);
  const [hiddenMetricKeys, setHiddenMetricKeys] = useState<string[]>(
    hiddenMetrics ?? []
  );
  const [isUpdatingMetrics, setIsUpdatingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Report interval state
  const [reportIntervalMinutes, setReportIntervalMinutes] = useState<string>("60");
  const [isUpdatingInterval, setIsUpdatingInterval] = useState(false);
  const [intervalError, setIntervalError] = useState<string | null>(null);
  const [intervalSuccess, setIntervalSuccess] = useState<string | null>(null);

  const REPORT_INTERVAL_OPTIONS = [
    { value: "1", label: "1 minute", seconds: 60 },
    { value: "5", label: "5 minutes", seconds: 300 },
    { value: "10", label: "10 minutes", seconds: 600 },
    { value: "30", label: "30 minutes", seconds: 1800 },
    { value: "60", label: "1 hour", seconds: 3600 },
  ];

  const availableMetricSet = useMemo(
    () => new Set(availableMetrics ?? METRIC_OPTIONS.map((metric) => metric.key)),
    [availableMetrics]
  );

  const availableMetricKeys = useMemo(
    () => METRIC_OPTIONS.map((metric) => metric.key).filter((key) => availableMetricSet.has(key)),
    [availableMetricSet]
  );

  const hiddenMetricsSet = useMemo(
    () => new Set(hiddenMetricKeys),
    [hiddenMetricKeys]
  );

  const visibleCount =
    availableMetricKeys.length -
    availableMetricKeys.filter((key) => hiddenMetricsSet.has(key)).length;

  useEffect(() => {
    if (open) {
      setRenameValue(deviceName);
      setHiddenMetricKeys(hiddenMetrics ?? []);
      setMetricsError(null);
      setRenameError(null);
      setIntervalError(null);
      setIntervalSuccess(null);
    }
  }, [
    deviceName,
    hiddenMetrics,
    open,
  ]);

  const handleUpdateReportInterval = async () => {
    if (!device) {
      setIntervalError("Device information not available");
      return;
    }

    if (device.provider !== "qingping") {
      setIntervalError("Report interval can only be changed for Qingping devices");
      return;
    }

    const selectedOption = REPORT_INTERVAL_OPTIONS.find(
      (opt) => opt.value === reportIntervalMinutes
    );
    if (!selectedOption) {
      setIntervalError("Invalid interval selected");
      return;
    }

    setIsUpdatingInterval(true);
    setIntervalError(null);
    setIntervalSuccess(null);

    try {
      const result = await updateReportInterval({
        userId: device.userId,
        deviceId,
        reportIntervalSeconds: selectedOption.seconds,
      });

      if (result.success) {
        setIntervalSuccess(result.message);
        setTimeout(() => setIntervalSuccess(null), 5000);
      } else {
        setIntervalError(result.message);
      }
    } catch (err) {
      setIntervalError(
        err instanceof Error ? err.message : "Failed to update report interval"
      );
    } finally {
      setIsUpdatingInterval(false);
    }
  };

  const handleToggleMetric = async (metricKey: string) => {
    setMetricsError(null);
    const isHidden = hiddenMetricsSet.has(metricKey);

    if (!isHidden && visibleCount <= 1) {
      setMetricsError("At least one metric must remain visible.");
      return;
    }

    const nextHidden = isHidden
      ? hiddenMetricKeys.filter((key) => key !== metricKey)
      : [...hiddenMetricKeys, metricKey];

    setHiddenMetricKeys(nextHidden);
    setIsUpdatingMetrics(true);
    try {
      await updateHiddenMetrics({ deviceId, hiddenMetrics: nextHidden });
    } catch (err) {
      setHiddenMetricKeys(hiddenMetricKeys);
      setMetricsError(
        err instanceof Error ? err.message : "Failed to update metrics"
      );
    } finally {
      setIsUpdatingMetrics(false);
    }
  };

  const handleRename = async () => {
    const nextName = renameValue.trim();
    if (!nextName) {
      setRenameError("Device name cannot be empty.");
      return;
    }
    if (nextName === deviceName) {
      setRenameError(null);
      return;
    }
    setIsRenaming(true);
    setRenameError(null);
    try {
      await renameDevice({ deviceId, name: nextName });
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : "Failed to rename device");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteDevice({ deviceId });
      setShowDeleteDialog(false);
      setOpen(false);
      router.push("/dashboard");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete device");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Device Settings</DialogTitle>
            <DialogDescription>
              Manage visible metrics, rename your monitor, or delete it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium">Visible Metrics</h4>
                <p className="text-xs text-muted-foreground">
                  Choose which metrics appear on the device profile.
                </p>
              </div>
              <div className="space-y-3">
                {METRIC_OPTIONS.filter((metric) =>
                  availableMetricSet.has(metric.key)
                ).map((metric) => (
                  <div
                    key={metric.key}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <Label htmlFor={`metric-${metric.key}`} className="text-sm">
                      {metric.label}
                    </Label>
                    <Switch
                      id={`metric-${metric.key}`}
                      checked={!hiddenMetricsSet.has(metric.key)}
                      onCheckedChange={() => handleToggleMetric(metric.key)}
                      disabled={isUpdatingMetrics}
                    />
                  </div>
                ))}
                {availableMetricSet.size === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No metrics available yet.
                  </p>
                )}
              </div>
              {metricsError && (
                <p className="text-sm text-destructive">{metricsError}</p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium">Rename Monitor</h4>
                <p className="text-xs text-muted-foreground">
                  Update the name shown across the dashboard.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="device-name">Device Name</Label>
                <Input
                  id="device-name"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                />
                {renameError && (
                  <p className="text-sm text-destructive">{renameError}</p>
                )}
              </div>
              <Button onClick={handleRename} disabled={isRenaming}>
                {isRenaming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Name"
                )}
              </Button>
            </div>

            {device?.provider === "qingping" && (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium">Data Report Frequency</h4>
                  <p className="text-xs text-muted-foreground">
                    Control how often the device sends data via webhook. Shorter intervals provide more real-time data but use more battery.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="report-interval">Report Interval</Label>
                  <Select
                    value={reportIntervalMinutes}
                    onValueChange={setReportIntervalMinutes}
                    disabled={isUpdatingInterval}
                  >
                    <SelectTrigger id="report-interval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_INTERVAL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {intervalError && (
                    <p className="text-sm text-destructive">{intervalError}</p>
                  )}
                  {intervalSuccess && (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      {intervalSuccess}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleUpdateReportInterval}
                  disabled={isUpdatingInterval || !device}
                >
                  {isUpdatingInterval ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Report Interval"
                  )}
                </Button>
              </div>
            )}

            <div className="space-y-3 rounded-lg border border-destructive/50 p-4">
              <div className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-4 w-4" />
                <h4 className="text-sm font-medium">Delete Monitor</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Permanently remove this monitor and all its historical data.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete Monitor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Monitor
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. The monitor, history, and all related data
              will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This action will permanently delete everything associated with this monitor:
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  <li>The monitor itself</li>
                  <li>All historical readings and data</li>
                  <li>All embed tokens and configurations</li>
                </ul>
                This action cannot be undone.
              </AlertDescription>
            </Alert>

            {deleteError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{deleteError}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteError(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Monitor"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
