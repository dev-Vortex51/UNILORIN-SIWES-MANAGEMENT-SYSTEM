/* eslint-disable max-lines */
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle2, ClipboardCheck, Loader2, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import {
  attendanceService,
  type AttendanceRecord,
  type DayStatus,
} from "@/services/attendance.service";
import { placementService } from "@/services/placement.service";
import { LogbookReviewDialog } from "../../logbooks/components/LogbookReviewDialog";
import type { Logbook } from "../../logbooks/types";

interface InlineQuickActionsProps {
  supervisorId: string;
  pendingLogbookCount: number;
}

type AttendanceActionMode = "approve" | "reject" | "reclassify";

const DAY_STATUS_OPTIONS: Array<{ value: DayStatus; label: string }> = [
  { value: "PRESENT_ON_TIME", label: "Present (On Time)" },
  { value: "PRESENT_LATE", label: "Present (Late)" },
  { value: "HALF_DAY", label: "Half Day" },
  { value: "ABSENT", label: "Absent" },
  { value: "EXCUSED_ABSENCE", label: "Excused Absence" },
  { value: "INCOMPLETE", label: "Incomplete" },
];

function getAttendanceId(record: AttendanceRecord) {
  return String(record.id || "");
}

function getIndustrialReview(logbook: any) {
  return (
    logbook?.industrialReview ||
    logbook?.reviews?.find((review: any) => review?.supervisorType === "industrial")
  );
}

function isPendingIndustrialReview(logbook: any) {
  const overallStatus = String(logbook?.status || "").toLowerCase();
  if (overallStatus !== "submitted") return false;

  const industrialReview = getIndustrialReview(logbook);
  const roleStatus = String(logbook?.industrialReviewStatus || "").toLowerCase();

  return !industrialReview && !["reviewed", "approved", "rejected"].includes(roleStatus);
}

async function getNextPendingLogbook(supervisorId: string): Promise<Logbook | null> {
  const dashboard = await apiClient.get(`/supervisors/${supervisorId}/dashboard`);
  const students = dashboard.data?.data?.supervisor?.assignedStudents || [];

  const candidates: Logbook[] = [];

  for (const student of students) {
    const studentId = student?.id || student?._id;
    if (!studentId) continue;

    const response = await apiClient.get(`/logbooks?student=${studentId}`);
    const logbooks = response.data?.data || [];

    for (const logbook of logbooks) {
      if (!isPendingIndustrialReview(logbook)) continue;
      const normalized: Logbook = {
        ...logbook,
        id: logbook.id || logbook._id,
        student: {
          ...(logbook.student || {}),
          id: logbook.student?.id || studentId,
          matricNumber: logbook.student?.matricNumber || student?.matricNumber || "N/A",
          user: {
            firstName: logbook.student?.user?.firstName || student?.user?.firstName || "",
            lastName: logbook.student?.user?.lastName || student?.user?.lastName || "",
            email: logbook.student?.user?.email || student?.user?.email || "",
          },
        },
      };
      candidates.push(normalized);
    }
  }

  if (!candidates.length) return null;

  candidates.sort(
    (a, b) =>
      new Date(a.submittedAt || a.createdAt || 0).getTime() -
      new Date(b.submittedAt || b.createdAt || 0).getTime(),
  );

  return candidates[0];
}

async function getNextPendingAttendance(supervisorId: string): Promise<{
  record: AttendanceRecord;
  placementName: string;
} | null> {
  const placements = await placementService.getMyPlacements();
  const mine = (placements || []).filter(
    (placement: any) => placement.industrialSupervisor?.id === supervisorId,
  );

  const candidates: Array<{ record: AttendanceRecord; placementName: string }> = [];

  for (const placement of mine) {
    const records = await attendanceService.getPlacementAttendance(placement.id, {});
    const pending = (records || []).filter(
      (record) => record.approvalStatus === "PENDING" || record.approvalStatus === "NEEDS_REVIEW",
    );

    for (const record of pending) {
      candidates.push({
        record,
        placementName: placement.companyName || "No company",
      });
    }
  }

  if (!candidates.length) return null;

  candidates.sort(
    (a, b) => new Date(a.record.date).getTime() - new Date(b.record.date).getTime(),
  );

  return candidates[0];
}

export function InlineQuickActions({ supervisorId, pendingLogbookCount }: InlineQuickActionsProps) {
  const queryClient = useQueryClient();
  const [isLocatingLogbook, setIsLocatingLogbook] = useState(false);
  const [isLocatingAttendance, setIsLocatingAttendance] = useState(false);
  const [selectedLogbook, setSelectedLogbook] = useState<Logbook | null>(null);
  const [logbookDialogOpen, setLogbookDialogOpen] = useState(false);

  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [attendanceTarget, setAttendanceTarget] = useState<{
    record: AttendanceRecord;
    placementName: string;
  } | null>(null);
  const [attendanceMode, setAttendanceMode] = useState<AttendanceActionMode>("approve");
  const [attendanceComment, setAttendanceComment] = useState("");
  const [reclassifyStatus, setReclassifyStatus] = useState<DayStatus>("PRESENT_ON_TIME");

  const reviewMutation = useMutation({
    mutationFn: async (status: "reviewed" | "rejected") => {
      if (!selectedLogbook?.id) throw new Error("No logbook selected");
      await apiClient.post(`/logbooks/${selectedLogbook.id}/industrial-review`, { status });
    },
    onSuccess: () => {
      toast.success("Logbook review submitted");
      setLogbookDialogOpen(false);
      setSelectedLogbook(null);
      queryClient.invalidateQueries({ queryKey: ["supervisor-dashboard", supervisorId] });
      queryClient.invalidateQueries({ queryKey: ["supervisor-students", supervisorId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to submit logbook review");
    },
  });

  const attendanceMutation = useMutation({
    mutationFn: async () => {
      if (!attendanceTarget) throw new Error("No attendance selected");
      const id = getAttendanceId(attendanceTarget.record);
      if (!id) throw new Error("Attendance record is invalid");

      if (attendanceMode === "approve") {
        return attendanceService.approveAttendance(id, {
          comment: attendanceComment.trim() || undefined,
        });
      }

      if (attendanceMode === "reject") {
        if (!attendanceComment.trim()) throw new Error("Rejection reason is required");
        return attendanceService.rejectAttendance(id, attendanceComment.trim());
      }

      if (!attendanceComment.trim()) throw new Error("Reclassification reason is required");
      return attendanceService.reclassifyAttendance(id, {
        dayStatus: reclassifyStatus,
        comment: attendanceComment.trim(),
      });
    },
    onSuccess: () => {
      toast.success(
        attendanceMode === "approve"
          ? "Attendance approved"
          : attendanceMode === "reject"
            ? "Attendance rejected"
            : "Attendance reclassified",
      );
      setAttendanceDialogOpen(false);
      setAttendanceTarget(null);
      setAttendanceComment("");
      setAttendanceMode("approve");
      queryClient.invalidateQueries({ queryKey: ["supervisor-dashboard", supervisorId] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to update attendance");
    },
  });

  async function openNextLogbook() {
    if (!supervisorId) return;
    setIsLocatingLogbook(true);
    try {
      const nextLogbook = await getNextPendingLogbook(supervisorId);
      if (!nextLogbook) {
        toast.info("No pending logbook review found");
        return;
      }
      setSelectedLogbook(nextLogbook);
      setLogbookDialogOpen(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to load pending logbook");
    } finally {
      setIsLocatingLogbook(false);
    }
  }

  async function openNextAttendance() {
    if (!supervisorId) return;
    setIsLocatingAttendance(true);
    try {
      const nextAttendance = await getNextPendingAttendance(supervisorId);
      if (!nextAttendance) {
        toast.info("No pending attendance review found");
        return;
      }
      setAttendanceTarget(nextAttendance);
      setAttendanceMode("approve");
      setAttendanceComment("");
      setReclassifyStatus(nextAttendance.record.dayStatus || "PRESENT_ON_TIME");
      setAttendanceDialogOpen(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to load pending attendance");
    } finally {
      setIsLocatingAttendance(false);
    }
  }

  return (
    <>
      <section className="rounded-md border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
        </div>
        <div className="space-y-3 p-4">
          <Button onClick={() => void openNextLogbook()} className="h-11 w-full justify-between">
            <span className="inline-flex items-center gap-2">
              {isLocatingLogbook ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
              Review Next Logbook
            </span>
            <Badge variant="secondary">{pendingLogbookCount}</Badge>
          </Button>

          <Button
            variant="outline"
            onClick={() => void openNextAttendance()}
            className="h-11 w-full justify-start gap-2 border-border"
          >
            {isLocatingAttendance ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Resolve Next Attendance
          </Button>
        </div>
      </section>

      <LogbookReviewDialog
        open={logbookDialogOpen}
        onOpenChange={setLogbookDialogOpen}
        logbook={selectedLogbook}
        onSubmitReview={(status) => reviewMutation.mutate(status)}
        isSubmittingReview={reviewMutation.isPending}
      />

      <Dialog open={attendanceDialogOpen} onOpenChange={setAttendanceDialogOpen}>
        <DialogContent className="box-border w-[min(38rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]">
          <DialogHeader>
            <DialogTitle>Resolve Attendance</DialogTitle>
            <DialogDescription>
              Apply a quick decision to the next pending attendance record.
            </DialogDescription>
          </DialogHeader>

          {attendanceTarget ? (
            <div className="space-y-4">
              <div className="rounded-md border border-border/60 p-3">
                <p className="text-sm font-semibold text-foreground">
                  {attendanceTarget.record.student?.user?.firstName} {attendanceTarget.record.student?.user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {attendanceTarget.record.student?.matricNumber || "N/A"} · {attendanceTarget.placementName}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {format(new Date(attendanceTarget.record.date), "EEEE, MMM d, yyyy")}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button
                  type="button"
                  variant={attendanceMode === "approve" ? "default" : "outline"}
                  onClick={() => setAttendanceMode("approve")}
                  className="justify-start gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  type="button"
                  variant={attendanceMode === "reject" ? "destructive" : "outline"}
                  onClick={() => setAttendanceMode("reject")}
                  className="justify-start gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
                <Button
                  type="button"
                  variant={attendanceMode === "reclassify" ? "default" : "outline"}
                  onClick={() => setAttendanceMode("reclassify")}
                  className="justify-start gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reclassify
                </Button>
              </div>

              {attendanceMode === "reclassify" ? (
                <div className="space-y-2">
                  <Label>New Day Status</Label>
                  <Select
                    value={reclassifyStatus}
                    onValueChange={(value) => setReclassifyStatus(value as DayStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day status" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>
                  {attendanceMode === "approve"
                    ? "Comment (optional)"
                    : attendanceMode === "reject"
                      ? "Rejection Reason"
                      : "Reason"}
                </Label>
                <Textarea
                  value={attendanceComment}
                  onChange={(event) => setAttendanceComment(event.target.value)}
                  placeholder={
                    attendanceMode === "approve"
                      ? "Optional comment for this decision..."
                      : "Enter reason..."
                  }
                  rows={4}
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAttendanceDialogOpen(false);
                setAttendanceTarget(null);
                setAttendanceComment("");
                setAttendanceMode("approve");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => attendanceMutation.mutate()}
              disabled={attendanceMutation.isPending}
              variant={attendanceMode === "reject" ? "destructive" : "default"}
            >
              {attendanceMutation.isPending
                ? "Submitting..."
                : attendanceMode === "approve"
                  ? "Approve Attendance"
                  : attendanceMode === "reject"
                    ? "Reject Attendance"
                    : "Reclassify Attendance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
