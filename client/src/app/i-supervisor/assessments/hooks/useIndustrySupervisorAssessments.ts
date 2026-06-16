import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { useUrlSearchState } from "@/hooks/useUrlSearchState";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { Assessment, AssessmentScore, StudentOption } from "../types";
import { filterAssessments } from "../utils/assessment-ui";

const defaultScores: AssessmentScore = {
  technical: 0,
  communication: 0,
  punctuality: 0,
  initiative: 0,
  teamwork: 0,
};

export function useIndustrySupervisorAssessments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const supervisorId = user?.profileData?.id;
  const { searchQuery, setSearchQuery } = useUrlSearchState();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [scores, setScores] = useState<AssessmentScore>(defaultScores);
  const [strengths, setStrengths] = useState("");
  const [areasForImprovement, setAreasForImprovement] = useState("");
  const [comment, setComment] = useState("");
  const [recommendation, setRecommendation] = useState<"excellent" | "very_good" | "good" | "fair" | "poor">("good");

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
    setScores(defaultScores);
    setStrengths("");
    setAreasForImprovement("");
    setComment("");
    setRecommendation("good");
  };

  const createAssessmentMutation = useMutation({
    mutationFn: async (assessmentData: any) => {
      const response = await apiClient.post("/assessments", assessmentData);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Assessment submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["assessments", supervisorId] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create assessment");
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

  const averageScore = useMemo(() => {
    const withScores = assessments.filter((a) => a.technical != null);
    if (!withScores.length) return 0;
    const sum = withScores.reduce((acc, a) => {
      const avg = (a.technical + a.communication + a.punctuality + a.initiative + a.teamwork) / 5;
      return acc + avg;
    }, 0);
    return Math.round(sum / withScores.length);
  }, [assessments]);

  const handleCreateAssessment = () => {
    const assessmentData = {
      student: selectedStudent,
      type: "industrial",
      scores,
      strengths,
      areasForImprovement,
      comment,
      recommendation,
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
    averageScore,
    isLoading: assessmentsQuery.isLoading || dashboardQuery.isLoading,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    students,
    selectedStudent,
    setSelectedStudent,
    scores,
    setScores,
    strengths,
    setStrengths,
    areasForImprovement,
    setAreasForImprovement,
    comment,
    setComment,
    recommendation,
    setRecommendation,
    handleCreateAssessment,
    isSubmitting: createAssessmentMutation.isPending,
  };
}
