"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUrlSearchState } from "@/hooks/useUrlSearchState";
import { useInvitations } from "./hooks/useInvitations";
import { CreateInvitationDialog } from "./components/CreateInvitationDialog";
import { BulkInviteDialog } from "@/components/shared/bulk-invite-dialog";
import { InvitationStats } from "@/app/admin/invitations/components/InvitationStats";
import { InvitationFilters } from "@/app/admin/invitations/components/InvitationFilters";
import { InvitationsTable } from "@/app/admin/invitations/components/InvitationsTable";
import { InvitationsHeader } from "@/app/admin/invitations/components/InvitationsHeader";
import invitationService, {
  type BulkInvitationRow,
} from "@/services/invitation.service";
import { toast } from "sonner";

const COORDINATOR_ROLE_OPTIONS = [
  { label: "Student", value: "student" },
  { label: "Industrial Supervisor", value: "industrial_supervisor" },
];

type CoordinatorInvitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
};

export default function CoordinatorInvitationsPage() {
  const queryClient = useQueryClient();
  const { searchQuery, setSearchQuery } = useUrlSearchState();
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  const {
    invitations,
    stats,
    isLoading,
    createInvitation,
    isCreating,
    resendInvitation,
    isResending,
    cancelInvitation,
    isCancelling,
  } = useInvitations(statusFilter);

  const bulkCreateMutation = useMutation({
    mutationFn: (data: BulkInvitationRow[]) =>
      invitationService.bulkCreateInvitations(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["invitation-stats"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Bulk invitation failed");
    },
  });

  const filteredInvitations = (invitations as CoordinatorInvitation[]).filter((inv) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      inv.email.toLowerCase().includes(query) ||
      inv.role.toLowerCase().includes(query);
    const matchesRole = roleFilter === "all" || inv.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4 md:space-y-5">
      <InvitationsHeader
        onOpenCreate={() => setIsCreateDialogOpen(true)}
        onOpenBulk={() => setIsBulkOpen(true)}
      />

      <CreateInvitationDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={createInvitation}
        isPending={isCreating}
      />

      <BulkInviteDialog
        open={isBulkOpen}
        onOpenChange={setIsBulkOpen}
        roleOptions={COORDINATOR_ROLE_OPTIONS}
        onSubmit={bulkCreateMutation.mutateAsync}
      />

      <InvitationStats stats={stats} />

      <InvitationFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        roleOptions={[
          { label: "All Roles", value: "all" },
          { label: "Student", value: "student" },
          { label: "Industrial Supervisor", value: "industrial_supervisor" },
        ]}
      />

      <InvitationsTable
        invitations={filteredInvitations}
        isLoading={isLoading}
        onResend={resendInvitation}
        onCancel={cancelInvitation}
        isResending={isResending}
        isCancelling={isCancelling}
      />
    </div>
  );
}
