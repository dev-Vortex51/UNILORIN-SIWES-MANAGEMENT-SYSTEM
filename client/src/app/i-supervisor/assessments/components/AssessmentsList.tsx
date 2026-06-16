import { Award, Calendar, ClipboardCheck } from "lucide-react";
import { LoadingCard } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Assessment } from "../types";
import { getScoreBadge, getStatusBadge, getStudentName, getStudentMatric, calcAverageScore } from "../utils/assessment-ui";

interface AssessmentsListProps {
  assessments: Assessment[];
  isLoading: boolean;
  searchQuery: string;
  statusFilter: string;
}

export function AssessmentsList({
  assessments,
  isLoading,
  searchQuery,
  statusFilter,
}: AssessmentsListProps) {
  if (isLoading) {
    return <LoadingCard />;
  }

  if (!assessments.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <ClipboardCheck className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {searchQuery || statusFilter !== "all"
                  ? "No Assessments Found"
                  : "No Assessments Yet"}
              </h3>
              <p className="mt-1 text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Submit your first assessment to rate a student's performance"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessments ({assessments.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {assessments.map((assessment) => {
            const statusConfig = getStatusBadge(assessment.status);
            const avgScore = calcAverageScore(assessment);
            const scoreConfig = avgScore != null ? getScoreBadge(avgScore) : null;

            return (
              <div
                key={assessment.id}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/5"
              >
                <div className="flex flex-1 items-center gap-4">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <ClipboardCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{getStudentName(assessment)}</p>
                      <span className="text-sm text-muted-foreground">
                        ({getStudentMatric(assessment)})
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {assessment.createdAt
                          ? new Date(assessment.createdAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                      {avgScore != null ? (
                        <span className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          Score: {avgScore}%
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {scoreConfig ? (
                    <Badge variant={scoreConfig.variant} className="min-w-[80px] justify-center">
                      {scoreConfig.label}
                    </Badge>
                  ) : null}
                  <Badge variant={statusConfig.variant}>{statusConfig.text}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
