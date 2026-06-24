"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/design-system";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyInfoCard } from "./components/CompanyInfoCard";
import { NotificationPreferencesCard } from "./components/NotificationPreferencesCard";
import { ProfileInfoCard } from "./components/ProfileInfoCard";
import { useIndustrySupervisorSettings } from "./hooks/useIndustrySupervisorSettings";
import { LogoutAllDevicesButton } from "@/components/shared/logout-all-devices-button";

export default function ISupervisorSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    success,
    isChangingPassword,
    handlePasswordChange,
  } = useIndustrySupervisorSettings();
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);

  const onSubmitPassword = (event: FormEvent) => {
    handlePasswordChange(event);
    if (!error) {
      setSecurityDialogOpen(false);
    }
  };

  const requestedTab = searchParams.get("tab");
  const activeTab =
    requestedTab === "security" || requestedTab === "preferences"
      ? requestedTab
      : "profile";

  const handleTabChange = (nextTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 md:space-y-5">
      <PageHeader
        title="Settings"
        description="Manage your profile, security, and supervisor preferences."
      />

      <section className="rounded-lg border border-border bg-card p-3 shadow-sm md:p-4">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="h-auto min-w-max bg-muted/70 p-1">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="profile" className="mt-3 space-y-4">
            <ProfileInfoCard user={user} />
            <CompanyInfoCard user={user} />
          </TabsContent>

          <TabsContent value="security" className="mt-3 space-y-4">
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="overflow-hidden rounded-md border border-border/60">
                <div className="grid grid-cols-1 gap-3 border-b border-border/60 p-3 md:grid-cols-[190px_1fr_auto] md:items-center">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                  <p className="text-sm font-medium text-foreground">
                    Update your account password in a secure dialog.
                  </p>
                  <Dialog open={securityDialogOpen} onOpenChange={setSecurityDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full md:w-auto">Update Password</Button>
                    </DialogTrigger>
                    <DialogContent className="w-[calc(100vw-1rem)] max-w-lg max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                          Enter your current password and choose a new secure password.
                        </DialogDescription>
                      </DialogHeader>

                      <form onSubmit={onSubmitPassword} className="space-y-4">
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
                          id="i-supervisor-current-password"
                          label="Current Password"
                          value={currentPassword}
                          onChange={setCurrentPassword}
                        />
                        <FieldInput
                          id="i-supervisor-new-password"
                          label="New Password"
                          value={newPassword}
                          helper="Must be at least 8 characters long"
                          onChange={setNewPassword}
                        />
                        <FieldInput
                          id="i-supervisor-confirm-password"
                          label="Confirm Password"
                          value={confirmPassword}
                          onChange={setConfirmPassword}
                        />

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSecurityDialogOpen(false)}
                            className="w-full sm:w-auto"
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isChangingPassword} className="w-full sm:w-auto">
                            {isChangingPassword ? "Updating Password..." : "Update Password"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="grid grid-cols-1 gap-1 p-3 md:grid-cols-[190px_1fr] md:items-center">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password Rules</Label>
                  <p className="text-sm font-medium text-foreground">Minimum 8 characters, confirmation required.</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm">
              <div>
                <p className="text-sm font-medium">Active Sessions</p>
                <p className="text-sm text-muted-foreground">Log out of all other devices and browsers</p>
              </div>
              <LogoutAllDevicesButton />
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="mt-3">
            <NotificationPreferencesCard />
          </TabsContent>
        </Tabs>
      </section>
    </div>
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
