"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser, SignOutButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { User, CreditCard, Link2, LogOut, CheckCircle, XCircle, Trash2, AlertTriangle, Loader2 } from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const { isLoaded, userId, signOut } = useAuth();
  const { user } = useUser();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const deleteUser = useMutation(api.users.deleteUser);
  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    if (!isLoaded || !userId || convexUserId || !user) return;

    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) return;

    getOrCreateUser({
      authId: userId,
      email,
      name: user.fullName ?? undefined,
    })
      .then(setConvexUserId)
      .catch(console.error);
  }, [isLoaded, userId, user, convexUserId, getOrCreateUser]);

  const convexUser = useQuery(
    api.users.getCurrentUser,
    userId ? { authId: userId } : "skip"
  );

  const devices = useQuery(
    api.devices.list,
    convexUserId ? { userId: convexUserId } : "skip"
  );

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() ?? "U";

  const handleDeleteAccount = async () => {
    if (!convexUserId) {
      setDeleteError("User not found. Please refresh the page.");
      return;
    }

    if (deleteConfirmText !== "DELETE") {
      setDeleteError('Please type "DELETE" to confirm');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteUser({ userId: convexUserId });

      // Delete Clerk user BEFORE signing out (requires active session)
      try {
        if (user) {
          await user.delete();
        }
      } catch (clerkDeleteError) {
        console.error("Clerk user deletion failed", clerkDeleteError);
      }

      // Sign out after Clerk deletion (session may already be invalid, so catch errors)
      try {
        await signOut();
      } catch (signOutError) {
        console.error("Sign out failed after deletion", signOutError);
      }

      setDeleteSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete account. Please try again.",
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-muted-foreground">
          Manage your profile and connected services
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? ""} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {user?.fullName ?? "User"}
              </h3>
              <p className="text-muted-foreground">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>Your current plan and usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                {convexUser?.plan?.toUpperCase() ?? "STARTER"}
              </Badge>
              <span className="text-muted-foreground">Current Plan</span>
            </div>
            <Button variant="outline" size="sm">
              Upgrade
            </Button>
          </div>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-2xl font-bold">{devices?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Devices Connected</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">7</p>
              <p className="text-sm text-muted-foreground">Days of History</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">1</p>
              <p className="text-sm text-muted-foreground">Embed Widgets</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Connected Services
          </CardTitle>
          <CardDescription>
            Manage your connected sensor providers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-medium">Qingping</p>
                <p className="text-sm text-muted-foreground">
                  {devices?.length ?? 0} device(s) synced
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-dashed border-border p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground">PurpleAir</p>
                <p className="text-sm text-muted-foreground">Coming soon</p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              Connect
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-dashed border-border p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground">IQAir</p>
                <p className="text-sm text-muted-foreground">Coming soon</p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              Connect
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogOut className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Sign out</p>
                <p className="text-sm text-muted-foreground">
                  Sign out of your account on this device
                </p>
              </div>
            </div>
            <SignOutButton>
              <Button variant="outline" size="sm">
                Sign Out
              </Button>
            </SignOutButton>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and all
              associated data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Deleting your account will permanently remove:
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  <li>All your devices ({devices?.length ?? 0} device{devices?.length !== 1 ? "s" : ""})</li>
                  <li>All device readings and history</li>
                  <li>All rooms and organization</li>
                  <li>All provider connections and credentials</li>
                  <li>All embed tokens and kiosk configurations</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Type <strong>DELETE</strong> to confirm:
              </Label>
              <input
                id="delete-confirm"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => {
                  setDeleteConfirmText(e.target.value);
                  setDeleteError(null);
                }}
                placeholder="DELETE"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isDeleting}
              />
            </div>

            {deleteError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{deleteError}</AlertDescription>
              </Alert>
            )}

            {deleteSuccess && (
              <Alert>
                <AlertDescription>
                  Account deleted. Redirecting to the website...
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmText("");
                setDeleteError(null);
                setDeleteSuccess(false);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmText !== "DELETE"}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
