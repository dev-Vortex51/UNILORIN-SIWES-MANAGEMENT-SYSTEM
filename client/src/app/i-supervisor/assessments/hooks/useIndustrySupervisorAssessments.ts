import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { useUrlSearchState } from "@/hooks/useUrlSearchState";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { Assessment, StudentOption } from "../types";
import { filterAssessments } from "../utils/assessment-ui";

export function useIndustrySupervisorAssessments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const supervisorId = user?.profileData?.id;
  const { searchQuery, setSearchQuery } = useUrlSearchState();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [technical, setTechnical] = useState("");
  const [initiative, setInitiative] = useState("");
  const [professionalism, setProfessionalism] = useState("");
  const [communication, setCommunication] = useState("");
  const [strengths, setStrengths] = useState("");
  const [areasForImprovement, setAreasForImprovement] = useState("");
  const [comment, setComment] = useState("");

  const dashboardQuery = useQuery({
    queryKey: ["supervisor-dashboard", supervisorId],
    queryFn: async () => {
      const response = await apiClient.get(`/supervisors/${supervisorId}/dashboard`);
      return response.data.data;
    },
    enabled: !!supervisorId,
  });

  const assessmentsQuery = useQuery({
    queryKey: ["assessments", supervisorId],
    queryFn: async () => {
      const response = await apiClient.get("/assessments", {
        params: { supervisor: supervisorId },
      });
      return response.data.data || [];
    },
    enabled: !!supervisorId,
  });

  const resetForm = () => {
    setSelectedStudent("");
    setTechnical("");
    setInitiative("");
    setProfessionalism("");
    setCommunication("");
    setStrengths("");
    setAreasForImprovement("");
    setComment("");
  };

  const createAssessmentMutation = useMutation({
    mutationFn: async (assessmentData: any) => {
      const response = await apiClient.post("/assessments", assessmentData);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Feedback submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["assessments", supervisorId] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to submit feedback");
    },
  });

  const assessments = useMemo<Assessment[]>(
    () => assessmentsQuery.data || [],
    [assessmentsQuery.data],
  );

  const students = useMemo<StudentOption[]>(
    () => dashboardQuery.data?.supervisor?.assignedStudents || [],
    [dashboardQuery.data],
  );

  const filteredAssessments = useMemo(
    () => filterAssessments(assessments, searchQuery),
    [assessments, searchQuery],
  );

  const completedCount = useMemo(
    () =>
      assessments.filter(
        (assessment) =>
          assessment.status === "completed" || assessment.status === "submitted",
      ).length,
    [assessments],
  );

  const pendingCount = useMemo(
    () => assessments.filter((assessment) => assessment.status === "pending").length,
    [assessments],
  );

  const handleCreateAssessment = () => {
    const assessmentData = {
      student: selectedStudent,
      type: "industrial",
      technical: parseInt(technical) || 0,
      initiative: parseInt(initiative) || 0,
      professionalism: parseInt(professionalism) || 0,
      communication: parseInt(communication) || 0,
      strengths,
      areasForImprovement,
      comment,
    };
    createAssessmentMutation.mutate(assessmentData);
  };

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    assessments,
    filteredAssessments,
    completedCount,
    pendingCount,
    isLoading: assessmentsQuery.isLoading || dashboardQuery.isLoading,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    students,
    selectedStudent,
    setSelectedStudent,
    technical,
    setTechnical,
    initiative,
    setInitiative,
    professionalism,
    setProfessionalism,
    communication,
    setCommunication,
    strengths,
    setStrengths,
    areasForImprovement,
    setAreasForImprovement,
    comment,
    setComment,
    handleCreateAssessment,
    isSubmitting: createAssessmentMutation.isPending,
  };
}
