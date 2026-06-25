"use client";

import { useQuery } from "@tanstack/react-query";
import { gradeService } from "@/services/grade.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const scoreRow = (label: string, score: number, max: number) => (
  <div className="flex items-center justify-between py-1.5 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{score} / {max}</span>
  </div>
);

export default function StudentGradePage() {
  const { data: grade, isLoading } = useQuery({
    queryKey: ["my-grade"],
    queryFn: () => gradeService.getMyGrade(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!grade) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold">My Final Grade</h1>
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Grade not yet available. Please check back after your training period ends.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Final Grade</h1>
        <Badge variant={grade.isFinalized ? "default" : "secondary"} className="text-sm px-3 py-1">
          {grade.isFinalized ? "Finalized" : "Provisional"}
        </Badge>
      </div>

      {grade.placement && (
        <p className="text-sm text-muted-foreground -mt-4">
          {grade.placement.companyName} &middot; {new Date(grade.placement.startDate).toLocaleDateString()} – {new Date(grade.placement.endDate).toLocaleDateString()}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Logbook Assessment</CardTitle></CardHeader>
          <CardContent>
            {scoreRow("Entry Completion", grade.entryCompletion, 20)}
            <hr className="my-1" />
            {scoreRow("Industry Review Coverage", grade.industryReview, 10)}
            <hr className="my-1" />
            {scoreRow("Submission Consistency", grade.submissionConsistency, 5)}
            <hr className="my-1" />
            {scoreRow("Final Visitation Evaluation", grade.visitationEval, 15)}
            <hr className="my-1" />
            <div className="flex items-center justify-between pt-1 font-semibold text-sm">
              <span>Logbook Subtotal</span>
              <span>{grade.entryCompletion + grade.industryReview + grade.submissionConsistency + grade.visitationEval} / 50</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Industry Assessment</CardTitle></CardHeader>
          <CardContent>
            {scoreRow("Attendance & Punctuality", grade.attendanceScore, 5)}
            <hr className="my-1" />
            {scoreRow("Technical Competence", grade.technical, 10)}
            <hr className="my-1" />
            {scoreRow("Initiative & Problem Solving", grade.initiative, 5)}
            <hr className="my-1" />
            {scoreRow("Professional Conduct", grade.conduct, 5)}
            <hr className="my-1" />
            {scoreRow("Communication & Teamwork", grade.communication, 5)}
            <hr className="my-1" />
            <div className="flex items-center justify-between pt-1 font-semibold text-sm">
              <span>Industry Subtotal</span>
              <span>{grade.attendanceScore + grade.technical + grade.initiative + grade.conduct + grade.communication} / 30</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20">
        <CardHeader><CardTitle className="text-base">Total Score</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {scoreRow("Defense Score", grade.defenseScore, 20)}
            <hr className="my-1" />
            <div className="flex items-center justify-between pt-1 text-lg font-bold">
              <span>Grand Total</span>
              <span>{grade.totalScore} / 100</span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span>Grade</span>
              <span className="text-2xl font-extrabold text-primary">{grade.grade}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
