"use client";

import { useMemo, useState } from "react";
import { useUrlSearchState } from "@/hooks/useUrlSearchState";
import {
  DashboardMetricsGrid,
  ErrorLocalState,
  FilterFieldSearch,
  FilterFieldSelect,
  LoadingPage,
  PageHeader,
} from "@/components/design-system";
import { VisitDetailsDialog } from "@/app/d-supervisor/visits/components/VisitDetailsDialog";
import { CompleteVisitDialog } from "@/app/d-supervisor/visits/components/CompleteVisitDialog";
import { VisitsTable } from "@/app/d-supervisor/visits/components/VisitsTable";
import type { Visit } from "@/app/d-supervisor/visits/types";
import { useCoordinatorVisits } from "./hooks/useCoordinatorVisits";

export default function CoordinatorVisitsPage() {
  const { searchQuery, setSearchQuery } = useUrlSearchState();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [visitToComplete, setVisitToComplete] = useState<Visit | null>(null);

  const { visits, isLoading, isError, completeMutation, cancelMutation } =
    useCoordinatorVisits();

  const filteredVisits = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return visits.filter((visit) => {
      const name = `${visit.student?.user?.firstName || ""} ${visit.student?.user?.lastName || ""}`
        .trim()
        .toLowerCase();

      const matchesQuery =
        !query ||
        name.includes(query) ||
        visit.student?.matricNumber?.toLowerCase().includes(query) ||
        (visit.location || "").toLowerCase().includes(query);

      if (!matchesQuery) return false;
      if (statusFilter !== "all" && visit.status !== statusFilter) return false;
      if (typeFilter !== "all" && visit.type !== typeFilter) return false;
      return true;
    });
  }, [visits, searchQuery, statusFilter, typeFilter]);

  if (isLoading) {
    return <LoadingPage label="Loading visit records..." />;
  }

  if (isError) {
    return (
      <div className="space-y-4 md:space-y-5">
        <PageHeader
          title="Visit Oversight"
          description="Review and close supervisory visit activities across the department."
        />
        <ErrorLocalState message="Visit records could not be loaded." />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHeader
        title="Visit Oversight"
        description="Review and close supervisory visit activities across the department."
      />

      <DashboardMetricsGrid
        items={[
          {
            label: "Total Visits",
            value: visits.length,
            hint: "Department scope records",
            trend: "up",
          },
          {
            label: "Scheduled",
            value: visits.filter((item) => item.status === "scheduled").length,
            hint: "Upcoming or pending",
            trend: "neutral",
          },
          {
            label: "Completed",
            value: visits.filter((item) => item.status === "completed").length,
            hint: "Closed supervision",
            trend: "up",
          },
          {
            label: "Cancelled",
            value: visits.filter((item) => item.status === "cancelled").length,
            hint: "Cancelled records",
            trend: "down",
          },
        ]}
      />

      <section className="rounded-lg border bg-card p-3 shadow-sm md:p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px] md:items-center">
          <FilterFieldSearch
            placeholder="Search by student name, matric number, or location"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full max-w-none"
          />
          <FilterFieldSelect
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Filter by status"
            className="w-full min-w-0"
            options={[
              { label: "All Statuses", value: "all" },
              { label: "Scheduled", value: "scheduled" },
              { label: "Completed", value: "completed" },
              { label: "Cancelled", value: "cancelled" },
            ]}
          />
          <FilterFieldSelect
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="Filter by type"
            className="w-full min-w-0"
            options={[
              { label: "All Types", value: "all" },
              { label: "Physical", value: "physical" },
              { label: "Virtual", value: "virtual" },
            ]}
          />
        </div>
      </section>

      <VisitsTable
        visits={filteredVisits}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        onView={(visit) => {
          setSelectedVisit(visit);
          setIsViewDialogOpen(true);
        }}
        onComplete={(visit) => {
          setVisitToComplete(visit);
        }}
        onCancel={(id) => cancelMutation.mutate(id)}
        canEditScheduled={false}
        canCompleteScheduled
        canCancelScheduled
      />

      <VisitDetailsDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        visit={selectedVisit}
      />

      <CompleteVisitDialog
        open={!!visitToComplete}
        onOpenChange={(open) => { if (!open) setVisitToComplete(null); }}
        visit={visitToComplete}
        onSubmit={(payload) => {
          if (visitToComplete) {
            completeMutation.mutate({ id: visitToComplete.id, payload });
          }
        }}
        isSubmitting={completeMutation.isPending}
      />
    </div>
  );
}
