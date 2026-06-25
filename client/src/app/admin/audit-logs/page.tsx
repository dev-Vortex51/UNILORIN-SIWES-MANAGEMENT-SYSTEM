"use client";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AtlassianTable,
  FilterBar,
  FilterFieldSelect,
  FilterFieldSearch,
  LoadingPage,
  PageHeader,
  type AtlassianTableColumn,
} from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { auditService, type AuditLog } from "@/services/audit.service";
import { format } from "date-fns";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  LOGIN: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  LOGOUT: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  EXPORT: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  APPROVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  REJECT: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  ASSIGN: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  REVOKE: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

const ACTION_OPTIONS = [
  { label: "All Actions", value: "" },
  { label: "Create", value: "CREATE" },
  { label: "Update", value: "UPDATE" },
  { label: "Delete", value: "DELETE" },
  { label: "Login", value: "LOGIN" },
  { label: "Approve", value: "APPROVE" },
  { label: "Reject", value: "REJECT" },
  { label: "Assign", value: "ASSIGN" },
  { label: "Export", value: "EXPORT" },
];

const ENTITY_OPTIONS = [
  { label: "All Entities", value: "" },
  { label: "User", value: "User" },
  { label: "Student", value: "Student" },
  { label: "Placement", value: "Placement" },
  { label: "Logbook", value: "Logbook" },
  { label: "Assessment", value: "Assessment" },
  { label: "Attendance", value: "Attendance" },
  { label: "Visit", value: "Visit" },
  { label: "Supervisor", value: "Supervisor" },
  { label: "Faculty", value: "Faculty" },
  { label: "Department", value: "Department" },
  { label: "Invitation", value: "Invitation" },
];

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, actionFilter, entityFilter],
    queryFn: () =>
      auditService.getAuditLogs({
        page,
        limit: 50,
        ...(actionFilter && { action: actionFilter }),
        ...(entityFilter && { entity: entityFilter }),
      }),
  });

  const logs = useMemo(() => data?.data || [], [data]);
  const pagination = data?.pagination;

  const columns: AtlassianTableColumn<AuditLog>[] = [
    {
      id: "time",
      header: "Timestamp",
      sortable: true,
      sortAccessor: (row) => row.createdAt,
      render: (row) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap font-mono">
          {format(new Date(row.createdAt), "MMM d, HH:mm:ss")}
        </span>
      ),
    },
    {
      id: "action",
      header: "Action",
      sortable: true,
      render: (row) => (
        <Badge className={`font-medium ${ACTION_COLORS[row.action] || ""}`}>
          {row.action}
        </Badge>
      ),
    },
    {
      id: "entity",
      header: "Entity",
      sortable: true,
      render: (row) => (
        <span className="text-sm font-medium">{row.entity}</span>
      ),
    },
    {
      id: "entityId",
      header: "Record ID",
      render: (row) => (
        <span className="text-xs font-mono text-muted-foreground">
          {row.entityId ? row.entityId.substring(0, 12) + "..." : "-"}
        </span>
      ),
    },
    {
      id: "user",
      header: "User",
      sortable: true,
      sortAccessor: (row) => row.userEmail || "",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm">{row.userEmail || "System"}</span>
          {row.userRole && (
            <span className="text-xs text-muted-foreground capitalize">
              {row.userRole.replace(/_/g, " ")}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "ip",
      header: "IP Address",
      render: (row) => (
        <span className="text-xs font-mono text-muted-foreground">
          {row.ipAddress || "-"}
        </span>
      ),
    },
  ];

  if (isLoading && !logs.length) {
    return <LoadingPage label="Loading audit logs..." />;
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHeader
        title="Audit Logs"
        description="Track all changes and actions performed in the system"
      />

      <FilterBar>
        <FilterFieldSelect
          value={actionFilter}
          onChange={(v) => {
            setActionFilter(v);
            setPage(1);
          }}
          options={ACTION_OPTIONS}
          placeholder="Filter by action"
        />
        <FilterFieldSelect
          value={entityFilter}
          onChange={(v) => {
            setEntityFilter(v);
            setPage(1);
          }}
          options={ENTITY_OPTIONS}
          placeholder="Filter by entity"
        />
      </FilterBar>

      <AtlassianTable
        title="Activity Log"
        subtitle={`${pagination?.totalItems || 0} total events recorded`}
        data={logs}
        columns={columns}
        rowKey={(row) => row.id}
        loading={isLoading}
        emptyTitle="No audit logs found"
        emptyDescription="No activity has been recorded matching your filters."
      />
    </div>
  );
}
