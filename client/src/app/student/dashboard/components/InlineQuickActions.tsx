"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus2, Loader2, MapPinCheckInside } from "lucide-react";
import { toast } from "sonner";
import { attendanceService } from "@/services/attendance.service";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";

interface InlineQuickActionsProps {
  placementApproved: boolean;
  onAttendanceRefresh?: () => void;
}

async function getLocation() {
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
}

export function InlineQuickActions({ placementApproved, onAttendanceRefresh }: InlineQuickActionsProps) {
  const queryClient = useQueryClient();
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false);
  const [absenceDate, setAbsenceDate] = useState("");
  const [absenceReason, setAbsenceReason] = useState("");

  const { data: todayCheckIn } = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: () => attendanceService.getTodayCheckIn(),
    enabled: placementApproved,
    refetchInterval: 30000,
  });

  const attendanceMutation = useMutation({
    mutationFn: async () => {
      const location = await getLocation();
      if (!todayCheckIn) {
        return attendanceService.checkIn({ location });
      }
      return attendanceService.checkOut({ location });
    },
    onSuccess: () => {
      toast.success(!todayCheckIn ? "Check-in successful" : "Check-out successful");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      onAttendanceRefresh?.();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Unable to submit attendance action");
    },
  });

  const absenceMutation = useMutation({
    mutationFn: () =>
      attendanceService.submitAbsenceRequest({
        startDate: absenceDate,
        endDate: absenceDate,
        reason: absenceReason.trim(),
      }),
    onSuccess: () => {
      toast.success("Absence request submitted");
      setAbsenceDialogOpen(false);
      setAbsenceDate("");
      setAbsenceReason("");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      onAttendanceRefresh?.();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to submit absence request");
    },
  });

  const alreadyCheckedOut = !!todayCheckIn?.checkOutTime;
  const attendanceLabel = !todayCheckIn
    ? "Check In Now"
    : alreadyCheckedOut
      ? "Attendance Completed"
      : "Check Out Now";

  const canSubmitAbsence = absenceDate && absenceReason.trim().length >= 10;

  return (
    <>
      <section className="rounded-md border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
        </div>
        <div className="space-y-3 p-4">
          <Button
            onClick={() => attendanceMutation.mutate()}
            disabled={!placementApproved || alreadyCheckedOut || attendanceMutation.isPending}
            className="h-11 w-full justify-between"
          >
            <span className="inline-flex items-center gap-2">
              {attendanceMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPinCheckInside className="h-4 w-4" />
              )}
              {attendanceLabel}
            </span>
            <Badge variant="secondary">
              {placementApproved ? (!todayCheckIn ? "Pending" : alreadyCheckedOut ? "Done" : "In Progress") : "Locked"}
            </Badge>
          </Button>

          <Button
            variant="outline"
            onClick={() => setAbsenceDialogOpen(true)}
            disabled={!placementApproved}
            className="h-11 w-full justify-start gap-2 border-border"
          >
            <CalendarPlus2 className="h-4 w-4" />
            Submit Absence Request
          </Button>
        </div>
      </section>

      <Dialog open={absenceDialogOpen} onOpenChange={setAbsenceDialogOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-lg">
          <DialogHeader>
            <DialogTitle>Absence Request</DialogTitle>
            <DialogDescription>
              Submit a dated request with a clear reason for supervisor review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="student-absence-date">Date</Label>
              <Input
                id="student-absence-date"
                type="date"
                value={absenceDate}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(event) => setAbsenceDate(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-absence-reason">Reason</Label>
              <Textarea
                id="student-absence-reason"
                value={absenceReason}
                onChange={(event) => setAbsenceReason(event.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Provide at least 10 characters."
              />
              <p className="text-xs text-muted-foreground">{absenceReason.length}/500 characters</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAbsenceDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => absenceMutation.mutate()}
              disabled={!canSubmitAbsence || absenceMutation.isPending}
            >
              {absenceMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
