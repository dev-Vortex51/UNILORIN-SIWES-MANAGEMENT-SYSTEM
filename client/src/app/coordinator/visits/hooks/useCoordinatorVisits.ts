"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { visitService } from "@/services/visit.service";
import type { Visit } from "@/app/d-supervisor/visits/types";

export function useCoordinatorVisits() {
  const queryClient = useQueryClient();

  const visitsQuery = useQuery({
    queryKey: ["coordinator-visits"],
    queryFn: async () => {
      const response = await visitService.getVisits({ limit: 300 });
      return response?.data || [];
    },
  });

  const completeMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) =>
      visitService.completeVisit(id, payload),
    onSuccess: () => {
      toast.success("Visit marked as completed");
      queryClient.invalidateQueries({ queryKey: ["coordinator-visits"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to complete visit");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => visitService.cancelVisit(id, {}),
    onSuccess: () => {
      toast.success("Visit cancelled");
      queryClient.invalidateQueries({ queryKey: ["coordinator-visits"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to cancel visit");
    },
  });

  const visits = useMemo<Visit[]>(() => visitsQuery.data || [], [visitsQuery.data]);

  return {
    visits,
    isLoading: visitsQuery.isLoading,
    isError: visitsQuery.isError,
    completeMutation,
    cancelMutation,
  };
}
