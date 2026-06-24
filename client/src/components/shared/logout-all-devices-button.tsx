"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authService } from "@/services/auth.service";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export function LogoutAllDevicesButton() {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleLogout = async () => {
    setIsPending(true);
    try {
      const result = await authService.logoutAllDevices();

      if (typeof window !== "undefined") {
        window.localStorage.setItem(ACCESS_TOKEN_KEY, result.accessToken);
        if (result.refreshToken) {
          window.localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
        }
        document.cookie = `accessToken=${result.accessToken}; Path=/; Max-Age=604800; SameSite=Lax`;
      }

      toast.success("Logged out of all other devices successfully");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to log out of other devices");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <LogOut className="mr-2 h-4 w-4" />
          Log Out All Devices
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log out of all devices?</DialogTitle>
          <DialogDescription>
            This will invalidate your session on all other devices and browsers. Your current
            session will remain active.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleLogout}
            className="w-full sm:w-auto"
          >
            {isPending ? "Logging out..." : "Log Out All Devices"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
