"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { studentService, logbookService } from "@/services/student.service";
import { apiClient } from "@/lib/api-client";
import {
  EmptyState,
  LoadingPage,
  PageHeader,
} from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import {
  LogbookOverviewCard,
  PlacementDetailsCard,
  RecentLogbookEntriesCard,
  StudentInformationCard,
} from "./components/StudentOverviewSections";
import {
  AssessmentWithFeedbackCard,
  AssessmentDetailsDialog,
} from "./components/AssessmentComponents";

export default function StudentDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = useAuth();
  const [viewingAssessment, setViewingAssessment] = useState<any>(null);

  // Fetch student details
  const { data: studentData, isLoading } = useQuery({
    queryKey: ["student", params.id],
    queryFn: () => studentService.getStudentById(params.id),
    enabled: !!params.id,
  });

  // Fetch student logbook entries
  const { data: logbookData } = useQuery({
    queryKey: ["logbook", params.id],
    queryFn: () => logbookService.getAllLogbooks({ student: params.id }),
    enabled: !!params.id,
  });

  // Fetch d-supervisor's departmental assessment for this student
  const { data: departmentalAssessment } = useQuery({
    queryKey: ["departmental-assessment", params.id, user?.profileData?.id],
    queryFn: async () => {
      const response = await apiClient.get("/assessments", {
        params: { student: params.id, type: "departmental", supervisor: user?.profileData?.id },
      });
      const data = response.data.data || [];
      return data[0] || null;
    },
    enabled: !!params.id && !!user?.profileData?.id,
  });

  // Fetch industrial supervisor feedback for this student
  const { data: industryFeedback } = useQuery({
    queryKey: ["industry-feedback", params.id],
    queryFn: async () => {
      const response = await apiClient.get("/assessments", {
        params: { student: params.id, type: "industrial" },
      });
      const assessments = response.data.data || [];
      return assessments.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    },
    enabled: !!params.id,
  });

  const student = studentData;
  const placement = student?.currentPlacement;
  const logbookEntries = logbookData?.data || [];
  const industryFeedbackData = industryFeedback?.[0] || null;

  if (isLoading) {
    return <LoadingPage label="Loading student profile..." />;
  }

  if (!student) {
    return (
      <div className="mx-auto max-w-md">
        <EmptyState
          title="Student Not Found"
          description="The student profile could not be found."
          actionLabel="Back to Students"
          onAction={() => {
            window.location.href = "/d-supervisor/students";
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5 max-w-5xl">
      <PageHeader
        title="Student Profile"
        description="Student details, placement status, and logbook activity."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/d-supervisor/students">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Students
            </Link>
          </Button>
        }
      />

      <StudentInformationCard student={student} />
      <PlacementDetailsCard placement={placement} />
      <AssessmentWithFeedbackCard
        assessment={departmentalAssessment}
        industryFeedback={industryFeedbackData}
        onViewDetails={setViewingAssessment}
      />
      <LogbookOverviewCard logbookEntries={logbookEntries} />
      <RecentLogbookEntriesCard logbookEntries={logbookEntries} />

      <AssessmentDetailsDialog
        assessment={viewingAssessment}
        industryFeedback={industryFeedbackData}
        open={!!viewingAssessment}
        onOpenChange={(open) => { if (!open) setViewingAssessment(null); }}
      />
    </div>
  );
}
