import type { FormEvent } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoutAllDevicesButton } from "@/components/shared/logout-all-devices-button";

interface SecuritySettingsCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  onPasswordDataChange: (next: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => void;
  error: string;
  success: string;
  isPending: boolean;
  onSubmit: (event: FormEvent) => void;
}

export function SecuritySettingsCard({
  open,
  onOpenChange,
  passwordData,
  onPasswordDataChange,
  error,
  success,
  isPending,
  onSubmit,
}: SecuritySettingsCardProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-lg border border-border bg-muted p-2">
              <Lock className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base">Security</CardTitle>
              <p className="text-sm text-muted-foreground">Manage your account password</p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
              <Button>Update Password</Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-1rem)] max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>
                  Enter your current password and choose a new secure password.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-5">
                {success ? (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    {success}
                  </div>
                ) : null}
                {error ? (
                  <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <FieldInput
                  id="d-supervisor-current-password"
                  label="Current Password"
                  value={passwordData.currentPassword}
                  onChange={(value) =>
                    onPasswordDataChange({
                      ...passwordData,
                      currentPassword: value,
                    })
                  }
                />
                <FieldInput
                  id="d-supervisor-new-password"
                  label="New Password"
                  value={passwordData.newPassword}
                  helper="Must be at least 8 characters long"
                  onChange={(value) =>
                    onPasswordDataChange({
                      ...passwordData,
                      newPassword: value,
                    })
                  }
                />
                <FieldInput
                  id="d-supervisor-confirm-password"
                  label="Confirm Password"
                  value={passwordData.confirmPassword}
                  onChange={(value) =>
                    onPasswordDataChange({
                      ...passwordData,
                      confirmPassword: value,
                    })
                  }
                />

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                    {isPending ? "Updating Password..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border border-border/60">
          <div className="grid grid-cols-1 gap-1 border-b border-border/60 p-3 md:grid-cols-[190px_1fr] md:items-center">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
            <p className="text-sm font-medium text-foreground">
              Password updates are handled in a secure dialog to reduce accidental edits.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-1 p-3 md:grid-cols-[190px_1fr] md:items-center">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password Rules</Label>
            <p className="text-sm font-medium text-foreground">Minimum 8 characters, confirmation required.</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-md border border-border/60 p-3">
          <div>
            <p className="text-sm font-medium">Active Sessions</p>
            <p className="text-sm text-muted-foreground">Log out of all other devices and browsers</p>
          </div>
          <LogoutAllDevicesButton />
        </div>
      </CardContent>
    </Card>
  );
}

function FieldInput({
  id,
  label,
  value,
  onChange,
  helper,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
      {helper ? <p className="text-sm text-muted-foreground">{helper}</p> : null}
    </div>
  );
}
