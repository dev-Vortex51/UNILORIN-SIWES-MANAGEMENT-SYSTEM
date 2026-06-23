"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, endOfMonth, startOfMonth, subMonths } from "date-fns";
import { CalendarDays, Clock3, Timer, TrendingUp } from "lucide-react";
import {
  attendanceService,
  type AttendanceFilters,
  type AttendanceRecord,
} from "@/services/attendance.service";
import { AtlassianTable, type AtlassianTableColumn } from "@/components/design-system/atlassian-table";
import { StatCard } from "@/components/design-system/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getApprovalTone = (status: string) => {
  const map: Record<string, string> = {
    APPROVED: "bg-emerald-100 text-emerald-800",
    PENDING: "bg-amber-100 text-amber-800",
    REJECTED: "bg-rose-100 text-rose-800",
    NEEDS_REVIEW: "bg-orange-100 text-orange-800",
  };
  return map[status] || "bg-slate-100 text-slate-700";
};

const dayStatusLabel = (status: string) =>
  status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const statusToDayStatus: Record<string, string> = {
  on_time: "PRESENT_ON_TIME",
  late: "PRESENT_LATE",
};

export function AttendanceHistory() {
  const [period, setPeriod] = useState("current");
  const [statusFilter, setStatusFilter] = useState<"all" | "on_time" | "late">("all");

  const filters = useMemo<AttendanceFilters>(() => {
    const now = new Date();

    if (period === "all") {
      return {
        startDate: "1970-01-01",
        endDate: format(now, "yyyy-MM-dd"),
        ...(statusFilter !== "all" ? { dayStatus: statusToDayStatus[statusFilter] as any } : {}),
      };
    }

    const base =
      period === "last"
        ? subMonths(now, 1)
        : period === "quarter"
        ? subMonths(now, 2)
        : now;

    return {
      startDate: format(startOfMonth(base), "yyyy-MM-dd"),
      endDate: format(endOfMonth(base), "yyyy-MM-dd"),
      ...(statusFilter !== "all" ? { dayStatus: statusToDayStatus[statusFilter] as any } : {}),
    };
  }, [period, statusFilter]);

  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ["attendance", "history", filters],
    queryFn: () => attendanceService.getMyAttendance(filters),
  });

  const historyRecords = useMemo(
    () =>
      attendance.filter(
        (record) =>
          !!record.checkInTime ||
          !!record.checkOutTime ||
          record.dayStatus === "PRESENT_ON_TIME" ||
          record.dayStatus === "PRESENT_LATE" ||
          record.dayStatus === "HALF_DAY" ||
          record.dayStatus === "INCOMPLETE",
      ),
    [attendance],
  );

  const analytics = useMemo(() => {
    const total = historyRecords.length;
    const present = historyRecords.filter(
      (record) =>
        record.dayStatus === "PRESENT_ON_TIME" ||
        record.dayStatus === "PRESENT_LATE" ||
        record.dayStatus === "HALF_DAY" ||
        record.dayStatus === "INCOMPLETE",
    ).length;
    const late = historyRecords.filter(
      (record) => record.dayStatus === "PRESENT_LATE" || record.punctuality === "LATE",
    ).length;
    const avgHours =
      historyRecords
        .filter((record) => typeof record.hoursWorked === "number")
        .reduce((sum, record) => sum + Number(record.hoursWorked || 0), 0) /
      Math.max(
        historyRecords.filter((record) => typeof record.hoursWorked === "number").length,
        1,
      );

    return {
      total,
      present,
      late,
      completionRate: total ? ((present + late) / total) * 100 : 0,
      avgHours,
    };
  }, [historyRecords]);

  const columns: AtlassianTableColumn<AttendanceRecord>[] = [
    {
      id: "date",
      header: "Date",
      sortable: true,
      sortAccessor: (record) => new Date(record.date).getTime(),
      render: (record) => (
        <p className="text-sm font-medium text-foreground">
          {format(new Date(record.date), "MMM d, yyyy")}
        </p>
      ),
    },
    {
      id: "duration",
      header: "Hours",
      align: "center",
      sortable: true,
      sortAccessor: (record) => Number(record.hoursWorked || 0),
      render: (record) => (
        <span className="text-sm font-semibold text-foreground">
          {typeof record.hoursWorked === "number" ? `${record.hoursWorked.toFixed(1)}h` : "-"}
        </span>
      ),
    },
    {
      id: "approval",
      header: "Approval",
      sortable: true,
      sortAccessor: (record) => record.approvalStatus,
      render: (record) => (
        <Badge className={getApprovalTone(record.approvalStatus)} variant="secondary">
          {dayStatusLabel(record.approvalStatus)}
        </Badge>
      ),
    },
    {
      id: "notes",
      header: "Notes",
      render: (record) => (
        <div className="max-w-[280px] space-y-1">
          {record.notes ? <p className="truncate text-sm">{record.notes}</p> : null}
          {record.absenceReason ? (
            <p className="truncate text-xs text-muted-foreground">Reason: {record.absenceReason}</p>
          ) : null}
          {record.supervisorComment ? (
            <p className="truncate text-xs text-blue-700">Comment: {record.supervisorComment}</p>
          ) : null}
          {!record.notes && !record.absenceReason && !record.supervisorComment ? (
            <span className="text-xs text-muted-foreground">-</span>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tracked Days"
          value={analytics.total}
          hint="Attendance records in selected period"
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <StatCard
          label="Present Days"
          value={analytics.present}
          hint="Completed working days"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Late Days"
          value={analytics.late}
          hint="Check-ins after expected time"
          icon={<Clock3 className="h-4 w-4" />}
        />
        <StatCard
          label="Average Hours"
          value={analytics.total ? analytics.avgHours.toFixed(1) : "0.0"}
          hint={`${analytics.completionRate.toFixed(1)}% completion`}
          icon={<Timer className="h-4 w-4" />}
        />
      </div>

      <AtlassianTable
        title="Attendance History"
        subtitle="Daily check-in records with approval and attendance classification"
        loading={isLoading}
        data={historyRecords}
        columns={columns}
        rowKey={(record) => String(record.id || record.date)}
        emptyTitle="No attendance records"
        emptyDescription="No check-in/out records were found for the selected filters."
        emptyIcon={<CalendarDays className="h-8 w-8 text-muted-foreground/50" />}
        actions={
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Month</SelectItem>
                <SelectItem value="last">Last Month</SelectItem>
                <SelectItem value="quarter">Last 3 Months</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as "all" | "on_time" | "late")
              }
            >
              <SelectTrigger className="h-9 w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="on_time">On Time</SelectItem>
                <SelectItem value="late">Late</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  );
}
