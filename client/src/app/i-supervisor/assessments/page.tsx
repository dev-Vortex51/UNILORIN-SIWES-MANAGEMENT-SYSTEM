"use client";

import { AssessmentFilters } from "./components/AssessmentFilters";
import { AssessmentGuidelines } from "./components/AssessmentGuidelines";
import { AssessmentsHeader } from "./components/AssessmentsHeader";
import { AssessmentsList } from "./components/AssessmentsList";
import { AssessmentStats } from "./components/AssessmentStats";
import { IAssessmentCreateDialog } from "./components/IAssessmentCreateDialog";
import { useIndustrySupervisorAssessments } from "./hooks/useIndustrySupervisorAssessments";

export default function AssessmentsPage() {
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    assessments,
    filteredAssessments,
    completedCount,
    pendingCount,
    averageScore,
    isLoading,
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
    isSubmitting,
  } = useIndustrySupervisorAssessments();

  return (
    <div className="space-y-6">
      <AssessmentsHeader onCreateClick={() => setIsCreateDialogOpen(true)} />

      <AssessmentFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <AssessmentStats
        total={assessments.length}
        completed={completedCount}
        drafts={pendingCount}
        averageScore={averageScore}
      />

      <AssessmentsList
        assessments={filteredAssessments}
        isLoading={isLoading}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
      />

      <AssessmentGuidelines />

      <IAssessmentCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        students={students}
        selectedStudent={selectedStudent}
        onStudentChange={setSelectedStudent}
        scores={scores}
        onScoresChange={setScores}
        strengths={strengths}
        onStrengthsChange={setStrengths}
        areasForImprovement={areasForImprovement}
        onAreasForImprovementChange={setAreasForImprovement}
        comment={comment}
        onCommentChange={setComment}
        recommendation={recommendation}
        onRecommendationChange={setRecommendation}
        onSubmit={handleCreateAssessment}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
