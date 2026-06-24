"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { ProfileCard } from "./components/ProfileCard";
import { SecurityCard } from "./components/SecurityCard";
import { SystemPreferencesCard } from "./components/SystemPreferencesCard";
import { LogoutAllDevicesButton } from "@/components/shared/logout-all-devices-button";

export default function CoordinatorSettingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    document.title = "Settings | ITMS";
  }, []);

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

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-destructive">Unable to load user profile. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 md:space-y-5">
      <PageHeader
        title="Settings"
        description="Manage your profile, security preferences, and coordinator workflow."
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

          <TabsContent value="profile" className="mt-3">
            <ProfileCard />
          </TabsContent>

          <TabsContent value="security" className="mt-3 space-y-4">
            <SecurityCard />
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm">
              <div>
                <p className="text-sm font-medium">Active Sessions</p>
                <p className="text-sm text-muted-foreground">Log out of all other devices and browsers</p>
              </div>
              <LogoutAllDevicesButton />
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="mt-3">
            <SystemPreferencesCard />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
