import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUrlSearchState } from "@/hooks/useUrlSearchState";
import adminService from "@/services/admin.service";
import invitationService, {
  type BulkInvitationRow,
} from "@/services/invitation.service";
import type {
  Department,
  Invitation,
  InvitationFormData,
  InvitationStats,
} from "../types";

const initialFormData: InvitationFormData = {
  email: "",
  role: "",
  department: "",
};

const initialStats: InvitationStats = {
  total: 0,
  pending: 0,
  accepted: 0,
  expired: 0,
  cancelled: 0,
};

export function useAdminInvitations() {
  const queryClient = useQueryClient();
  const { searchQuery, setSearchQuery } = useUrlSearchState();
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<InvitationFormData>(initialFormData);

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: () => adminService.departmentService.getAllDepartments(),
  });

  const invitationsQuery = useQuery({
    queryKey: ["invitations", statusFilter, roleFilter],
    queryFn: () => {
      const filters: Record<string, string> = {};
      if (statusFilter !== "all") filters.status = statusFilter;
      if (roleFilter !== "all") filters.role = roleFilter;
      return invitationService.getInvitations(filters);
    },
  });

  const statsQuery = useQuery({
    queryKey: ["invitation-stats"],
    queryFn: () => invitationService.getStatistics(),
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (invitations: BulkInvitationRow[]) =>
      invitationService.bulkCreateInvitations(invitations),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["invitation-stats"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: invitationService.createInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["invitation-stats"] });
      setIsCreateDialogOpen(false);
      setFormData(initialFormData);
      toast.success("Invitation sent successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send invitation");
    },
  });

  const resendMutation = useMutation({
    mutationFn: (id: string) => invitationService.resendInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation resent successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to resend invitation");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => invitationService.cancelInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["invitation-stats"] });
      toast.success("Invitation cancelled successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to cancel invitation");
    },
  });

  const invitations = useMemo<Invitation[]>(
    () => invitationsQuery.data?.data || [],
    [invitationsQuery.data],
  );

  const stats = useMemo<InvitationStats>(
    () => statsQuery.data?.data || initialStats,
    [statsQuery.data],
  );

  const departments = useMemo<Department[]>(
    () => departmentsQuery.data?.data || [],
    [departmentsQuery.data],
  );

  const filteredInvitations = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return invitations;

    return invitations.filter((invitation) => {
      return (
        invitation.email.toLowerCase().includes(query) ||
        invitation.role.toLowerCase().includes(query) ||
        invitation.invitedBy?.email?.toLowerCase().includes(query)
      );
    });
  }, [invitations, searchQuery]);

  const createInvitation = () => {
    if (!formData.email || !formData.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.role === "coordinator" && !formData.department) {
      toast.error("Please select a department for the coordinator");
      return;
    }

    const invitationData: any = {
      email: formData.email,
      role: formData.role,
    };

    if (formData.role === "coordinator" && formData.department) {
      invitationData.metadata = { department: formData.department };
    }

    createMutation.mutate(invitationData);
  };

  return {
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
    invitations,
    filteredInvitations,
    stats,
    departments,
    createInvitation,
    resendInvitation: resendMutation.mutate,
    cancelInvitation: cancelMutation.mutate,
    bulkCreateInvitations: bulkCreateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isResending: resendMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isBulkCreating: bulkCreateMutation.isPending,
  };
}
