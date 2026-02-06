"use client";

import { useEffect, useMemo, useState } from "react";
import { useAction, useMutation } from "convex/react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2, Trash2, Clock, Lock } from "lucide-react";
import { getMinRefreshInterval, type Plan } from "@/convex/lib/planLimits";

type DeviceSettingsDialogProps = {
  deviceId: Id<"devices">;
  userId: Id<"users">;
  organizationId: Id<"organizations">;
  deviceName: string;
  hiddenMetrics?: string[];
  availableMetrics?: string[];
  reportInterval?: number;
  primaryMetrics?: string[];
  secondaryMetrics?: string[];
  dashboardMetricOptions?: { key: string; label: string }[];
  trigger: React.ReactNode;
  /** Hide profile-specific sections (Visible Metrics) when opened from dashboard */
  hideProfileMetrics?: boolean;
  /** Control dialog open state externally */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** User's current plan, used to gate interval options */
  userPlan?: Plan;
};

const INTERVAL_OPTIONS = [
  { value: 60, label: "1 minute" },
  { value: 300, label: "5 minutes" },
  { value: 600, label: "10 minutes" },
  { value: 1800, label: "30 minutes" },
  { value: 3600, label: "1 hour" },
];

/** Returns the minimum plan name required to use a given interval. */
function getRequiredPlanForInterval(intervalSeconds: number): Plan {
  if (intervalSeconds >= 3600) return "starter";
  if (intervalSeconds >= 1800) return "pro";
  if (intervalSeconds >= 300) return "business";
  return "custom";
}

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
  userId,
  organizationId,
  deviceName,
  hiddenMetrics,
  availableMetrics,
  reportInterval,
  primaryMetrics,
  secondaryMetrics,
  dashboardMetricOptions,
  trigger,
  hideProfileMetrics = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  userPlan = "starter",
}: DeviceSettingsDialogProps) {
  const router = useRouter();
  const updateHiddenMetrics = useMutation(api.devices.updateHiddenMetrics);
  const renameDevice = useMutation(api.devices.rename);
  const deleteDevice = useMutation(api.devices.deleteDevice);
  const updateReportInterval = useAction(api.providersActions.updateDeviceReportInterval);
  const updateDashboardMetrics = useMutation(api.devices.updateDashboardMetrics);

  const [internalOpen, setInternalOpen] = useState(false);
  
  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;
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

  const [selectedInterval, setSelectedInterval] = useState<string>(
    String(reportInterval ?? 3600)
  );
  const [isUpdatingInterval, setIsUpdatingInterval] = useState(false);
  const [intervalError, setIntervalError] = useState<string | null>(null);
  const [intervalSuccess, setIntervalSuccess] = useState<string | null>(null);

  const [primarySelection, setPrimarySelection] = useState<string[]>([]);
  const [secondarySelection, setSecondarySelection] = useState<string[]>([]);
  const [metricsSelectionError, setMetricsSelectionError] = useState<string | null>(null);

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

  const minInterval = getMinRefreshInterval(userPlan);

  useEffect(() => {
    if (open) {
      setRenameValue(deviceName);
      setHiddenMetricKeys(hiddenMetrics ?? []);
      setSelectedInterval(String(reportInterval ?? 3600));
      setMetricsError(null);
      setRenameError(null);
      setIntervalError(null);
      setIntervalSuccess(null);
      setMetricsSelectionError(null);
      
      if (dashboardMetricOptions && dashboardMetricOptions.length > 0) {
        const allKeys = dashboardMetricOptions.map((m) => m.key);
        // Default primary: first 2 available
        const defaultPrimary = allKeys.slice(0, 2);
        // Default secondary: next 4 available
        const defaultSecondary = allKeys.slice(2, 6);
        
        setPrimarySelection(
          primaryMetrics && primaryMetrics.length > 0
            ? primaryMetrics
            : defaultPrimary
        );
        setSecondarySelection(
          secondaryMetrics && secondaryMetrics.length > 0
            ? secondaryMetrics
            : defaultSecondary
        );
      }
    }
  }, [
    deviceName,
    hiddenMetrics,
    reportInterval,
    primaryMetrics,
    secondaryMetrics,
    dashboardMetricOptions,
    open,
  ]);

  const handleTogglePrimaryMetric = async (metricKey: string) => {
    setMetricsSelectionError(null);
    const isSelected = primarySelection.includes(metricKey);
    
    if (!isSelected && primarySelection.length >= 2) {
      setMetricsSelectionError("You can select up to 2 primary metrics.");
      return;
    }
    if (isSelected && primarySelection.length <= 1) {
      setMetricsSelectionError("Select at least 1 primary metric.");
      return;
    }
    
    const newPrimary = isSelected
      ? primarySelection.filter((key) => key !== metricKey)
      : [...primarySelection, metricKey];
    
    // If adding to primary, remove from secondary
    const newSecondary = isSelected
      ? secondarySelection
      : secondarySelection.filter((key) => key !== metricKey);
    
    setPrimarySelection(newPrimary);
    setSecondarySelection(newSecondary);
    
    // Auto-save immediately
    try {
      await updateDashboardMetrics({
        deviceId,
        primaryMetrics: newPrimary,
        secondaryMetrics: newSecondary,
      });
    } catch (err) {
      // Revert on error
      setPrimarySelection(primarySelection);
      setSecondarySelection(secondarySelection);
      setMetricsSelectionError(
        err instanceof Error ? err.message : "Failed to update metrics"
      );
    }
  };

  const handleToggleSecondaryMetric = async (metricKey: string) => {
    setMetricsSelectionError(null);
    const isSelected = secondarySelection.includes(metricKey);
    
    if (!isSelected && secondarySelection.length >= 6) {
      setMetricsSelectionError("You can select up to 6 secondary metrics.");
      return;
    }
    
    const newSecondary = isSelected
      ? secondarySelection.filter((key) => key !== metricKey)
      : [...secondarySelection, metricKey];
    
    // If adding to secondary, remove from primary
    const newPrimary = isSelected
      ? primarySelection
      : primarySelection.filter((key) => key !== metricKey);
    
    setPrimarySelection(newPrimary);
    setSecondarySelection(newSecondary);
    
    // Auto-save immediately
    try {
      await updateDashboardMetrics({
        deviceId,
        primaryMetrics: newPrimary,
        secondaryMetrics: newSecondary,
      });
    } catch (err) {
      // Revert on error
      setPrimarySelection(primarySelection);
      setSecondarySelection(secondarySelection);
      setMetricsSelectionError(
        err instanceof Error ? err.message : "Failed to update metrics"
      );
    }
  };

  const handleIntervalChange = async (value: string) => {
    setSelectedInterval(value);
    setIntervalError(null);
    setIntervalSuccess(null);
    setIsUpdatingInterval(true);
    
    try {
      const result = await updateReportInterval({
        organizationId,
        deviceId,
        reportIntervalSeconds: Number(value),
      });
      
      if (result.success) {
        setIntervalSuccess(result.message);
      } else {
        setIntervalError(result.message);
        // Revert to previous value on failure
        setSelectedInterval(String(reportInterval ?? 3600));
      }
    } catch (err) {
      setIntervalError(err instanceof Error ? err.message : "Failed to update interval");
      setSelectedInterval(String(reportInterval ?? 3600));
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
        {!isControlled && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Device Settings</DialogTitle>
            <DialogDescription>
              Manage visible metrics, rename your monitor, or delete it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2 max-h-[70vh] overflow-y-auto">
            {dashboardMetricOptions && dashboardMetricOptions.length > 0 && (
              <>
                {/* Primary Metrics Section */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium">Primary Metrics</h4>
                    <p className="text-xs text-muted-foreground">
                      Select up to 2 metrics shown as large gauges.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {dashboardMetricOptions.map((metric) => (
                      <div
                        key={`primary-${metric.key}`}
                        className="flex items-center justify-between rounded-lg border px-3 py-2"
                      >
                        <Label htmlFor={`primary-${metric.key}`} className="text-sm">
                          {metric.label}
                        </Label>
                        <Switch
                          id={`primary-${metric.key}`}
                          checked={primarySelection.includes(metric.key)}
                          onCheckedChange={() => handleTogglePrimaryMetric(metric.key)}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {primarySelection.length}/2 selected
                  </p>
                </div>

                {/* Secondary Metrics Section */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium">Secondary Metrics</h4>
                    <p className="text-xs text-muted-foreground">
                      Select up to 6 metrics shown as compact rows below.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {dashboardMetricOptions
                      .filter((metric) => !primarySelection.includes(metric.key))
                      .map((metric) => (
                        <div
                          key={`secondary-${metric.key}`}
                          className="flex items-center justify-between rounded-lg border px-3 py-2"
                        >
                          <Label htmlFor={`secondary-${metric.key}`} className="text-sm">
                            {metric.label}
                          </Label>
                          <Switch
                            id={`secondary-${metric.key}`}
                            checked={secondarySelection.includes(metric.key)}
                            onCheckedChange={() => handleToggleSecondaryMetric(metric.key)}
                          />
                        </div>
                      ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {secondarySelection.length}/6 selected
                  </p>
                </div>

                {metricsSelectionError && (
                  <p className="text-sm text-destructive">{metricsSelectionError}</p>
                )}
              </>
            )}

            {!hideProfileMetrics && (
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
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <h4 className="text-sm font-medium">Data Refresh Interval</h4>
                  <p className="text-xs text-muted-foreground">
                    How often the sensor sends new readings.
                  </p>
                </div>
              </div>
              <Select
                value={selectedInterval}
                onValueChange={handleIntervalChange}
                disabled={isUpdatingInterval}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  {INTERVAL_OPTIONS.map((option) => {
                    const isLocked = option.value < minInterval;
                    const requiredPlan = getRequiredPlanForInterval(option.value);
                    return (
                      <SelectItem
                        key={option.value}
                        value={String(option.value)}
                        disabled={isLocked}
                      >
                        <span className="flex items-center gap-2">
                          {option.label}
                          {isLocked && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Lock className="h-3 w-3" />
                              Upgrade to {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {isUpdatingInterval && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating interval...
                </div>
              )}
              {intervalError && (
                <p className="text-sm text-destructive">{intervalError}</p>
              )}
              {intervalSuccess && (
                <p className="text-sm text-emerald-500">{intervalSuccess}</p>
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
