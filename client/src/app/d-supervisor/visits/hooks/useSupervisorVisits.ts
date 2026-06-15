"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/components/providers/auth-provider";
import { visitService } from "@/services/visit.service";
import type { StudentOption, Visit, VisitFormState } from "../types";

const defaultForm: VisitFormState = {
  student: "",
  visitDate: "",
  type: "physical",
  objective: "",
  location: "",
};

const toDateTimeInput = (value: string) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 16);
};

export function useSupervisorVisits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const supervisorId = user?.profileData?.id;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [form, setForm] = useState<VisitFormState>(defaultForm);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [visitToComplete, setVisitToComplete] = useState<Visit | null>(null);

  const dashboardQuery = useQuery({
    queryKey: ["supervisor-dashboard", supervisorId],
    queryFn: async () => {
      const response = await apiClient.get(`/supervisors/${supervisorId}/dashboard`);
      return response.data.data;
    },
    enabled: !!supervisorId,
  });

  const visitsQuery = useQuery({
    queryKey: ["visits", supervisorId],
    queryFn: async () => {
      const response = await visitService.getVisits({ supervisor: supervisorId, limit: 200 });
      return response?.data || [];
    },
    enabled: !!supervisorId,
  });

  const resetForm = () => setForm(defaultForm);

  const createVisitMutation = useMutation({
    mutationFn: async (payload: any) => visitService.createVisit(payload),
    onSuccess: () => {
      toast.success("Visit scheduled successfully");
      queryClient.invalidateQueries({ queryKey: ["visits", supervisorId] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to schedule visit");
    },
  });

  const updateVisitMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) =>
      visitService.updateVisit(id, payload),
    onSuccess: () => {
      toast.success("Visit updated successfully");
      queryClient.invalidateQueries({ queryKey: ["visits", supervisorId] });
      setEditingVisitId(null);
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update visit");
    },
  });

  const completeVisitMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) =>
      visitService.completeVisit(id, payload),
    onSuccess: () => {
      toast.success("Visit marked as completed");
      queryClient.invalidateQueries({ queryKey: ["visits", supervisorId] });
      setVisitToComplete(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to complete visit");
    },
  });

  const cancelVisitMutation = useMutation({
    mutationFn: async (id: string) => visitService.cancelVisit(id, {}),
    onSuccess: () => {
      toast.success("Visit cancelled");
      queryClient.invalidateQueries({ queryKey: ["visits", supervisorId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to cancel visit");
    },
  });

  const openCreateDialog = () => {
    setEditingVisitId(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (visit: Visit) => {
    setEditingVisitId(visit.id);
    setForm({
      student: visit.studentId,
      visitDate: toDateTimeInput(visit.visitDate),
      type: visit.type,
      objective: visit.objective || "",
      location: visit.location || "",
    });
    setIsDialogOpen(true);
  };

  const submit = () => {
    const payload = {
      student: form.student,
      visitDate: form.visitDate,
      type: form.type,
      objective: form.objective,
      location: form.location,
    };

    if (editingVisitId) {
      updateVisitMutation.mutate({ id: editingVisitId, payload });
      return;
    }

    createVisitMutation.mutate(payload);
  };

  const visits = useMemo<Visit[]>(() => visitsQuery.data || [], [visitsQuery.data]);

  const students = useMemo<StudentOption[]>(
    () => dashboardQuery.data?.supervisor?.assignedStudents || [],
    [dashboardQuery.data],
  );

  return {
    visits,
    students,
    isLoading: visitsQuery.isLoading || dashboardQuery.isLoading,
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
  };
}
