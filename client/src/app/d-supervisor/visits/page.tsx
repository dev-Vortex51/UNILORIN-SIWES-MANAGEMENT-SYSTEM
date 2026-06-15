"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useUrlSearchState } from "@/hooks/useUrlSearchState";
import {
  DashboardMetricsGrid,
  FilterFieldSearch,
  FilterFieldSelect,
  LoadingPage,
  PageHeader,
} from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { VisitCreateDialog } from "./components/VisitCreateDialog";
import { VisitDetailsDialog } from "./components/VisitDetailsDialog";
import { CompleteVisitDialog } from "./components/CompleteVisitDialog";
import { VisitsTable } from "./components/VisitsTable";
import { useSupervisorVisits } from "./hooks/useSupervisorVisits";

export default function SupervisorVisitsPage() {
  const { searchQuery, setSearchQuery } = useUrlSearchState();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const {
    visits,
    students,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    editingVisitId,
    form,
    setForm,
    selectedVisit,
    setSelectedVisit,
    isViewDialogOpen,
    setIsViewDialogOpen,
    visitToComplete,
    setVisitToComplete,
    openCreateDialog,
    openEditDialog,
    submit,
    createVisitMutation,
    updateVisitMutation,
    completeVisitMutation,
    cancelVisitMutation,
  } = useSupervisorVisits();

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

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHeader
        title="Supervisor Visits"
        description="Schedule, update, and close field or virtual student supervision visits."
        actions={
          <Button onClick={() => openCreateDialog()} className="h-9">
            <Plus className="mr-2 h-4 w-4" />
            Schedule Visit
          </Button>
        }
      />

      <DashboardMetricsGrid
        items={[
          {
            label: "Total Visits",
            value: visits.length,
            hint: "All visit records",
            trend: "up",
          },
          {
            label: "Scheduled",
            value: visits.filter((item) => item.status === "scheduled").length,
            hint: "Upcoming visits",
            trend: "neutral",
          },
          {
            label: "Completed",
            value: visits.filter((item) => item.status === "completed").length,
            hint: "Closed with feedback",
            trend: "up",
          },
          {
            label: "Cancelled",
            value: visits.filter((item) => item.status === "cancelled").length,
            hint: "Not carried out",
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
        onEdit={openEditDialog}
        onComplete={(visit) => {
          setVisitToComplete(visit);
        }}
        onCancel={(id) => cancelVisitMutation.mutate(id)}
      />

      <VisitCreateDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        students={students}
        form={form}
        setForm={setForm}
        mode={editingVisitId ? "edit" : "create"}
        onSubmit={submit}
        isSubmitting={createVisitMutation.isPending || updateVisitMutation.isPending}
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
            completeVisitMutation.mutate({ id: visitToComplete.id, payload });
          }
        }}
        isSubmitting={completeVisitMutation.isPending}
      />
    </div>
  );
}
