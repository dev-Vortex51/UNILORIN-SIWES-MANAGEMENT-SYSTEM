"use client";

import { CheckCircle2, Eye, Pencil, XCircle } from "lucide-react";
import { ActionMenu, AtlassianTable, StatusBadge } from "@/components/design-system";
import type { Visit } from "../types";

interface VisitsTableProps {
  visits: Visit[];
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
  onView: (visit: Visit) => void;
  onEdit?: (visit: Visit) => void;
  onComplete?: (visit: Visit) => void;
  onCancel?: (id: string) => void;
  canEditScheduled?: boolean;
  canCompleteScheduled?: boolean;
  canCancelScheduled?: boolean;
}

export function VisitsTable({
  visits,
  searchQuery,
  statusFilter,
  typeFilter,
  onView,
  onEdit,
  onComplete,
  onCancel,
  canEditScheduled = true,
  canCompleteScheduled = true,
  canCancelScheduled = true,
}: VisitsTableProps) {
  return (
    <AtlassianTable
      title="Visit Records"
      subtitle={`${visits.length} record${visits.length === 1 ? "" : "s"}`}
      data={visits}
      rowKey={(visit) => visit.id}
      columns={[
        {
          id: "student",
          header: "Student",
          sortable: true,
          sortAccessor: (visit) =>
            `${visit.student?.user?.firstName || ""} ${visit.student?.user?.lastName || ""}`.trim(),
          render: (visit) => (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {visit.student?.user?.firstName} {visit.student?.user?.lastName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {visit.student?.matricNumber || "N/A"}
              </p>
            </div>
          ),
        },
        {
          id: "visitDate",
          header: "Visit Date",
          sortable: true,
          sortAccessor: (visit) => visit.visitDate,
          render: (visit) => (
            <span className="text-sm text-foreground">
              {new Date(visit.visitDate).toLocaleString()}
            </span>
          ),
        },
        {
          id: "type",
          header: "Type",
          sortable: true,
          sortAccessor: (visit) => visit.type,
          render: (visit) => (
            <span className="capitalize text-sm text-foreground">{visit.type}</span>
          ),
        },
        {
          id: "status",
          header: "Status",
          sortable: true,
          sortAccessor: (visit) => visit.status,
          render: (visit) => <StatusBadge status={visit.status} />,
        },
        {
          id: "location",
          header: "Location",
          render: (visit) => (
            <span className="truncate text-sm text-foreground">
              {visit.location || "Not specified"}
            </span>
          ),
        },
        {
          id: "actions",
          header: "",
          align: "right",
          width: 56,
          render: (visit) => (
            <ActionMenu
              items={[
                {
                  label: "View Details",
                  icon: <Eye className="h-3.5 w-3.5" />,
                  onClick: () => onView(visit),
                },
                ...(visit.status === "scheduled"
                  ? [
                      ...(canEditScheduled && onEdit
                        ? [
                            {
                              label: "Edit Visit",
                              icon: <Pencil className="h-3.5 w-3.5" />,
                              onClick: () => onEdit(visit),
                            },
                          ]
                        : []),
                      ...(canCompleteScheduled && onComplete
                        ? [
                            {
                              label: "Mark Completed",
                              icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                              onClick: () => onComplete(visit),
                            },
                          ]
                        : []),
                      ...(canCancelScheduled && onCancel
                        ? [
                            {
                              label: "Cancel Visit",
                              icon: <XCircle className="h-3.5 w-3.5" />,
                              onClick: () => onCancel(visit.id),
                            },
                          ]
                        : []),
                    ]
                  : []),
              ]}
            />
          ),
        },
      ]}
      emptyTitle="No visits found"
      emptyDescription={
        searchQuery || statusFilter !== "all" || typeFilter !== "all"
          ? "Try adjusting your search and filters."
          : "Schedule your first supervisory visit to get started."
      }
    />
  );
}
