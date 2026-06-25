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
    isLoading,
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
        technical={technical}
        onTechnicalChange={setTechnical}
        initiative={initiative}
        onInitiativeChange={setInitiative}
        professionalism={professionalism}
        onProfessionalismChange={setProfessionalism}
        communication={communication}
        onCommunicationChange={setCommunication}
        strengths={strengths}
        onStrengthsChange={setStrengths}
        areasForImprovement={areasForImprovement}
        onAreasForImprovementChange={setAreasForImprovement}
        comment={comment}
        onCommentChange={setComment}
        onSubmit={handleCreateAssessment}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
