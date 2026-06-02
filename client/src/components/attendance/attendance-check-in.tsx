/* eslint-disable max-lines */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  attendanceService,
  type AttendanceRecord,
} from "@/services/attendance.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertInline } from "@/components/design-system/alert-inline";
import { CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const OFFLINE_QUEUE_KEY = "itms:attendance:offline-actions";

interface AttendanceOfflineAction {
  id: string;
  type: "check-in" | "check-out";
  payload: {
    notes?: string;
    location?: any;
  };
  createdAt: string;
}

const readOfflineQueue = (): AttendanceOfflineAction[] => {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as AttendanceOfflineAction[];
  } catch {
    return [];
  }
};

export function AttendanceCheckIn() {
  const [notes, setNotes] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<AttendanceOfflineAction[]>([]);
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);
  const queryClient = useQueryClient();
  const syncInFlight = useRef(false);
  const queuePersistTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const { data: todayCheckIn, isLoading: isLoadingToday } = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: () => attendanceService.getTodayCheckIn(),
    refetchInterval: 30000,
  });

  const { data: monthAttendance, isLoading: isLoadingMonth } = useQuery({
    queryKey: ["attendance", "month", monthStart.toISOString()],
    queryFn: () =>
      attendanceService.getMyAttendance({
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString(),
      }),
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["attendance", "stats"],
    queryFn: () => attendanceService.getMyStats(),
  });

  const checkInMutation = useMutation({
    mutationFn: (data: { notes?: string; location?: any }) =>
      attendanceService.checkIn(data),
    onSuccess: () => {
      toast.success("Check-in successful");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to check in");
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: (data: { notes?: string; location?: any }) =>
      attendanceService.checkOut(data),
    onSuccess: () => {
      toast.success("Check-out successful");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to check out");
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setIsOnline(window.navigator.onLine);
    setOfflineQueue(readOfflineQueue());

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (queuePersistTimeout.current) {
      clearTimeout(queuePersistTimeout.current);
    }
    queuePersistTimeout.current = setTimeout(() => {
      window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(offlineQueue));
      queuePersistTimeout.current = null;
    }, 300);

    return () => {
      if (queuePersistTimeout.current) {
        clearTimeout(queuePersistTimeout.current);
        queuePersistTimeout.current = null;
      }
    };
  }, [offlineQueue]);

  const attendanceByDay = useMemo(() => {
    const records = monthAttendance || [];
    return records.reduce<Record<string, AttendanceRecord>>((acc, record) => {
      const key = format(new Date(record.date), "yyyy-MM-dd");
      acc[key] = record;
      return acc;
    }, {});
  }, [monthAttendance]);

  const calendarDays = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart, calendarEnd],
  );

  const getLocation = async () => {
    if (!navigator.geolocation) return undefined;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          enableHighAccuracy: false,
        });
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch {
      return undefined;
    }
  };

  const syncOfflineActions = useCallback(async () => {
    if (!isOnline || syncInFlight.current || offlineQueue.length === 0) {
      return;
    }

    syncInFlight.current = true;
    setIsSyncingOffline(true);
    const remaining: AttendanceOfflineAction[] = [];
    let processed = 0;
    let failed = false;

    for (const action of offlineQueue) {
      if (failed) {
        remaining.push(action);
        continue;
      }
      try {
        if (action.type === "check-in") {
          await attendanceService.checkIn(action.payload);
        } else {
          await attendanceService.checkOut(action.payload);
        }
        processed += 1;
      } catch {
        remaining.push(action);
        failed = true;
      }
    }

    setOfflineQueue(remaining);
    if (processed > 0) {
      toast.success("Offline attendance actions synced.");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    }
    if (remaining.length > 0) {
      toast.error("Some attendance actions could not sync yet.");
    }

    setIsSyncingOffline(false);
    syncInFlight.current = false;
  }, [isOnline, offlineQueue, queryClient]);

  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      void syncOfflineActions();
    }
  }, [isOnline, offlineQueue.length, syncOfflineActions]);

  const handleCheckIn = async () => {
    const location = await getLocation();
    const payload = { notes: notes || undefined, location };

    if (!isOnline) {
      setOfflineQueue((prev) => [
        ...prev,
        {
          id: `attendance-offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: "check-in",
          payload,
          createdAt: new Date().toISOString(),
        },
      ]);
      setNotes("");
      toast.info("Check-in saved offline. It will sync when internet is available.");
      return;
    }

    checkInMutation.mutate(payload);
  };

  const handleCheckOut = async () => {
    const location = await getLocation();
    const payload = { notes: notes || undefined, location };

    if (!isOnline) {
      setOfflineQueue((prev) => [
        ...prev,
        {
          id: `attendance-offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: "check-out",
          payload,
          createdAt: new Date().toISOString(),
        },
      ]);
      setNotes("");
      toast.info("Check-out saved offline. It will sync when internet is available.");
      return;
    }

    checkOutMutation.mutate(payload);
  };

  if (isLoadingToday || isLoadingMonth || isLoadingStats) {
    return (
      <div className="rounded-md border border-border bg-card p-6 shadow-sm">
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="h-10 w-full rounded bg-muted" />
          <div className="h-40 w-full rounded bg-muted" />
        </div>
      </div>
    );
  }

  const isCheckedIn = !!todayCheckIn;
  const isCheckedOut = !!todayCheckIn?.checkOutTime;

  return (
    <section className="rounded-md border border-border bg-card shadow-sm">
      <header className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground">Attendance Calendar</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {format(today, "MMMM yyyy")} check-in overview and today&apos;s attendance action.
        </p>
      </header>

      {!isOnline ? (
        <div className="px-4 pt-4">
          <AlertInline
            tone="warning"
            message={`Offline mode: attendance actions will queue locally (${offlineQueue.length} pending).`}
          />
        </div>
      ) : null}

      {isOnline && offlineQueue.length > 0 ? (
        <div className="px-4 pt-4">
          <AlertInline
            tone="info"
            message={`${offlineQueue.length} queued attendance action(s) pending sync.${isSyncingOffline ? " Syncing now..." : ""}`}
          />
        </div>
      ) : null}

      <div className="grid gap-4 p-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-md border border-border p-3">
          <div className="mb-3 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-1 text-center text-[11px] font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const record = attendanceByDay[dayKey];
              const inMonth = isSameMonth(day, monthStart);

              return (
                <div
                  key={dayKey}
                  className={[
                    "relative flex h-10 items-center justify-center rounded-md border text-xs",
                    inMonth
                      ? "border-border bg-background text-foreground"
                      : "border-transparent bg-muted/40 text-muted-foreground",
                    isToday(day) ? "border-primary" : "",
                  ].join(" ")}
                >
                  {format(day, "d")}
                  {record ? (
                    <span
                      className={[
                        "absolute bottom-1 h-1.5 w-1.5 rounded-full",
                        record.punctuality === "LATE" ? "bg-amber-500" : "bg-emerald-500",
                      ].join(" ")}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> On time
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Late
            </span>
          </div>
        </div>

        <div className="space-y-3 rounded-md border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Today
              </p>
              <p className="text-sm font-semibold text-foreground">
                {format(today, "EEEE, MMM d")}
              </p>
            </div>
            {isCheckedIn ? (
              <Badge variant="secondary" className="capitalize">
                {(todayCheckIn?.dayStatus || "INCOMPLETE").replaceAll("_", " ").toLowerCase()}
              </Badge>
            ) : (
              <Badge variant="outline">Pending</Badge>
            )}
          </div>

          {isCheckedIn ? (
            <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3 text-xs">
              <p className="flex items-center gap-2 text-foreground">
                <Clock className="h-3.5 w-3.5" />
                Checked in at {format(new Date(todayCheckIn!.checkInTime), "h:mm a")}
              </p>
              {todayCheckIn?.checkOutTime ? (
                <p className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Checked out at {format(new Date(todayCheckIn.checkOutTime), "h:mm a")}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              You have not checked in yet. Check in before 8:15 AM to be marked on time.
            </p>
          )}

          {!isCheckedOut ? (
            <div className="space-y-2">
              <Label htmlFor="attendance-notes" className="text-xs text-muted-foreground">
                Notes (optional)
              </Label>
              <Textarea
                id="attendance-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Add quick context for today"
              />
            </div>
          ) : null}

          {!isCheckedIn ? (
            <Button onClick={handleCheckIn} disabled={checkInMutation.isPending} className="w-full">
              {checkInMutation.isPending ? "Checking in..." : "Check In"}
            </Button>
          ) : null}

          {isCheckedIn && !isCheckedOut ? (
            <Button
              variant="outline"
              onClick={handleCheckOut}
              disabled={checkOutMutation.isPending}
              className="w-full"
            >
              {checkOutMutation.isPending ? "Checking out..." : "Check Out"}
            </Button>
          ) : null}

          {stats ? (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-md border border-border p-2">
                <p className="text-[11px] text-muted-foreground">Attendance Rate</p>
                <p className="text-sm font-semibold text-foreground">
                  {Number(stats.attendanceRate ?? 0).toFixed(1)}%
                </p>
              </div>
              <div className="rounded-md border border-border p-2">
                <p className="text-[11px] text-muted-foreground">Current Streak</p>
                <p className="text-sm font-semibold text-foreground">
                  {stats.currentStreak ?? 0} days
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
