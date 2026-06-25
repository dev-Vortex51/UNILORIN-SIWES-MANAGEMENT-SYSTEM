"use client";
import React, { createContext, useContext, useEffect } from "react";
import {
  notificationService,
  Notification,
} from "@/services/notification.service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/components/providers/auth-provider";
import { API_URL } from "@/lib/api-client";
import { isForceLogoutPending } from "@/lib/session";
import { toast } from "sonner";

type RealtimeEventMap = Record<string, {
  message: string;
  queryKeys?: string[][];
}>;

const REALTIME_EVENTS: RealtimeEventMap = {
  "attendance:check_in": { message: "Student checked in", queryKeys: [["attendance"]] },
  "attendance:check_out": { message: "Student checked out", queryKeys: [["attendance"]] },
  "attendance:approved": { message: "Attendance approved", queryKeys: [["attendance"]] },
  "attendance:rejected": { message: "Attendance rejected", queryKeys: [["attendance"]] },
  "attendance:reclassified": { message: "Attendance reclassified", queryKeys: [["attendance"]] },
  "attendance:absence_requested": { message: "Absence request submitted", queryKeys: [["attendance"]] },
  "attendance:marked_absent": { message: "Marked absent", queryKeys: [["attendance"]] },
  "logbook:submitted": { message: "New logbook submission", queryKeys: [["logbooks"], ["notifications"]] },
  "logbook:reviewed": { message: "Logbook reviewed", queryKeys: [["logbooks"]] },
  "logbook:ready_for_approval": { message: "Logbook ready for approval", queryKeys: [["logbooks"]] },
  "logbook:rejected": { message: "Logbook rejected", queryKeys: [["logbooks"]] },
  "logbook:final_review": { message: "Logbook decision made", queryKeys: [["logbooks"]] },
  "placement:submitted": { message: "New placement application", queryKeys: [["placements"]] },
  "placement:approved": { message: "Placement approved", queryKeys: [["placements"], ["students"]] },
  "placement:rejected": { message: "Placement not approved", queryKeys: [["placements"]] },
  "assessment:submitted": { message: "Assessment submitted", queryKeys: [["assessments"]] },
  "assessment:verified": { message: "Assessment verified", queryKeys: [["assessments"]] },
  "grade:updated": { message: "Grade updated", queryKeys: [["grades"], ["my-grade"]] },
  "grade:defense_updated": { message: "Defense score recorded", queryKeys: [["grades"], ["my-grade"]] },
  "grade:finalized": { message: "Grade finalized", queryKeys: [["grades"], ["my-grade"]] },
  "visit:created": { message: "Visit scheduled", queryKeys: [["visits"]] },
  "visit:completed": { message: "Visit completed", queryKeys: [["visits"]] },
  "visit:cancelled": { message: "Visit cancelled", queryKeys: [["visits"]] },
  "visit:updated": { message: "Visit updated", queryKeys: [["visits"]] },
  "supervisor:assigned": { message: "Supervisor assigned", queryKeys: [["students"], ["supervisors"]] },
  "supervisor:student_assigned": { message: "Student assigned", queryKeys: [["students"], ["supervisors"]] },
  "supervisor:unassigned": { message: "Supervisor unassigned", queryKeys: [["students"], ["supervisors"]] },
  "supervisor:student_unassigned": { message: "Student unassigned", queryKeys: [["students"], ["supervisors"]] },
  "admin:stats_changed": { message: "", queryKeys: [["admin", "stats"]] },
};

type NotificationContextType = {
  unreadCount: number;
  recent: Notification[];
  refetch: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = (): NotificationContextType => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  return ctx;
};

export const NotificationProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: unreadCount = 0, refetch: refetchUnread } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationService.getUnreadCount,
    staleTime: 30_000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    enabled: !!user,
  });

  const { data: recent = [], refetch: refetchRecent } = useQuery({
    queryKey: ["notifications", "recent"],
    queryFn: () => notificationService.getRecent(10),
    staleTime: 30_000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    enabled: !!user,
  });

  const refetch = async () => {
    await Promise.all([refetchUnread(), refetchRecent()]);
  };

  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    const token = window.localStorage.getItem("accessToken");
    if (!token) return;

    const socketBaseUrl = API_URL.replace(/\/api\/v1$/i, "").replace(
      /\/api$/i,
      "",
    );
    const socket: Socket = io(socketBaseUrl, {
      transports: ["websocket"],
      auth: {
        token,
      },
    });

    socket.on("notification:new", (incoming: Notification) => {
      queryClient.setQueryData<Notification[]>(
        ["notifications", "recent"],
        (current = []) => [incoming, ...current].slice(0, 10),
      );
      queryClient.setQueryData<number>(
        ["notifications", "unread-count"],
        (current = 0) => current + (incoming.isRead ? 0 : 1),
      );
    });

    socket.on("notification:unread_count", (payload: { count: number }) => {
      if (typeof payload?.count === "number") {
        queryClient.setQueryData(["notifications", "unread-count"], payload.count);
      }
    });

    socket.on("force_logout", (payload: { tokenVersion?: number }) => {
      // If this device initiated the logout (flag set by LogoutAllDevicesButton),
      // ignore the event — we already have a fresh token.
      if (isForceLogoutPending()) return;

      if (typeof window === "undefined") return;

      window.localStorage.removeItem("accessToken");
      window.localStorage.removeItem("refreshToken");
      window.localStorage.removeItem("itms:userCache");
      document.cookie = "accessToken=; Path=/; Max-Age=0; SameSite=Lax";

      const message = payload?.tokenVersion
        ? "Your session has been terminated on another device."
        : "Your password was changed. Please log in again.";
      (window as any).__sessionExpiredMessage = message;
      window.location.href = "/login";
    });

    // Register real-time event listeners for all pipeline events
    const registeredListeners: Array<{ event: string; handler: (...args: any[]) => void }> = [];
    for (const [event, config] of Object.entries(REALTIME_EVENTS)) {
      const handler = (...args: any[]) => {
        const data = args[0] || {};
        if (config.message) {
          toast.info(config.message, {
            description: data.studentName || data.companyName || "",
            duration: 4000,
          });
        }
        config.queryKeys?.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      };
      socket.on(event, handler);
      registeredListeners.push({ event, handler });
    }

    return () => {
      for (const { event, handler } of registeredListeners) {
        socket.off(event, handler);
      }
      socket.disconnect();
    };
  }, [queryClient, user]);

  return (
    <NotificationContext.Provider value={{ unreadCount, recent, refetch }}>
      {children}
    </NotificationContext.Provider>
  );
};
