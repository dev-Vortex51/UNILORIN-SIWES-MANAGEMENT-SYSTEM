"use client";

import { useState } from "react";
import { InvitationCreateDialog } from "./components/InvitationCreateDialog";
import { InvitationFilters } from "./components/InvitationFilters";
import { InvitationsHeader } from "./components/InvitationsHeader";
import { InvitationStats } from "./components/InvitationStats";
import { InvitationsTable } from "./components/InvitationsTable";
import { BulkInviteDialog } from "@/components/shared/bulk-invite-dialog";
import { useAdminInvitations } from "./hooks/useAdminInvitations";

const ADMIN_ROLE_OPTIONS = [
  { label: "Coordinator", value: "coordinator" },
  { label: "Academic Supervisor", value: "academic_supervisor" },
];

export default function AdminInvitationsPage() {
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    roleFilter,
    setRoleFilter,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    formData,
    setFormData,
    filteredInvitations,
    stats,
    departments,
    createInvitation,
    resendInvitation,
    cancelInvitation,
    bulkCreateInvitations,
    isLoading,
    isCreating,
    isResending,
    isCancelling,
    isBulkCreating,
  } = useAdminInvitations();

  return (
    <div className="space-y-4 md:space-y-5">
      <InvitationsHeader
        onOpenCreate={() => setIsCreateDialogOpen(true)}
        onOpenBulk={() => setIsBulkOpen(true)}
      />

      <InvitationCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        departments={departments}
        onSubmit={createInvitation}
        isCreating={isCreating}
      />

      <BulkInviteDialog
        open={isBulkOpen}
        onOpenChange={setIsBulkOpen}
        roleOptions={ADMIN_ROLE_OPTIONS}
        onSubmit={bulkCreateInvitations}
        isPending={isBulkCreating}
      />

      <InvitationStats stats={stats} />

      <InvitationFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
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
