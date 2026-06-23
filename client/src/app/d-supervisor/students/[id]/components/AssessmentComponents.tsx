import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Eye,
  MessageSquare,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function calcAssessmentAverage(assessment: any): number {
  const fields = [
    assessment?.technical,
    assessment?.communication,
    assessment?.punctuality,
    assessment?.initiative,
    assessment?.teamwork,
  ].filter((f) => f != null) as number[];
  if (!fields.length) return 0;
  return Math.round(fields.reduce((a, b) => a + b, 0) / fields.length);
}

export function AssessmentWithFeedbackCard({
  assessment,
  industryFeedback,
  onViewDetails,
}: {
  assessment: any;
  industryFeedback: any;
  onViewDetails: (assessment: any) => void;
}) {
  if (!assessment) return null;

  const avgScore = calcAssessmentAverage(assessment);
  const hasFeedback = !!(industryFeedback?.strengths || industryFeedback?.areasForImprovement || industryFeedback?.comment);

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Departmental Assessment</CardTitle>
            <CardDescription>Academic supervisor evaluation</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="rounded-md border border-border/60 overflow-hidden">
          <InfoRow label="Average Score" value={`${avgScore}%`} />
          <Separator />
          <InfoRow
            label="Status"
            value={
              <div className="flex items-center gap-2">
                <StatusBadge status={assessment.status || "pending"} />
              </div>
            }
          />
          <Separator />
          <InfoRow label="Created" value={assessment.createdAt ? new Date(assessment.createdAt).toLocaleDateString() : "N/A"} />
        </div>

        <div className="mt-4 rounded-md border border-border/60 p-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Industry Supervisor Feedback</span>
            {hasFeedback ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 ml-auto" />
            ) : (
              <Clock className="h-4 w-4 text-amber-600 ml-auto" />
            )}
          </div>
          {hasFeedback ? (
            <div className="mt-2 space-y-2 text-sm text-muted-foreground">
              {industryFeedback.strengths && (
                <p><span className="font-medium text-foreground">Strengths:</span> {industryFeedback.strengths}</p>
              )}
              {industryFeedback.areasForImprovement && (
                <p><span className="font-medium text-foreground">Areas to improve:</span> {industryFeedback.areasForImprovement}</p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Awaiting feedback from industry supervisor
            </p>
          )}
        </div>

        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={() => onViewDetails(assessment)}>
            <Eye className="h-4 w-4 mr-2" />
            View Full Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AssessmentDetailsDialog({
  assessment,
  industryFeedback,
  open,
  onOpenChange,
}: {
  assessment: any;
  industryFeedback: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!assessment) return null;

  const avgScore = calcAssessmentAverage(assessment);
  const hasFeedback = !!(industryFeedback?.strengths || industryFeedback?.areasForImprovement || industryFeedback?.comment);

  const scoreFields = [
    { label: "Technical Skills", value: assessment.technical },
    { label: "Communication", value: assessment.communication },
    { label: "Punctuality", value: assessment.punctuality },
    { label: "Initiative", value: assessment.initiative },
    { label: "Teamwork", value: assessment.teamwork },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assessment Details</DialogTitle>
          <DialogDescription>
            Academic supervisor evaluation with industry supervisor feedback
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Academic Supervisor Scores
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {scoreFields.map((field) => (
                <div key={field.label} className="rounded-md border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">{field.label}</p>
                  <p className="text-lg font-semibold mt-1">{field.value ?? "N/A"}/100</p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-md bg-primary/5 p-3">
              <p className="text-sm font-medium">Average Score: <span className="text-lg font-bold">{avgScore}%</span></p>
            </div>
            {assessment.grade && (
              <div className="mt-2 rounded-md bg-accent/10 p-3">
                <p className="text-sm font-medium">Grade: <span className="text-lg font-bold">{assessment.grade}</span></p>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Industry Supervisor Feedback
              {hasFeedback ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Clock className="h-4 w-4 text-amber-600" />
              )}
            </h3>
            {hasFeedback ? (
              <div className="space-y-3">
                {industryFeedback.strengths && (
                  <div className="rounded-md border border-border/60 p-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Strengths</p>
                    <p className="mt-1 text-sm">{industryFeedback.strengths}</p>
                  </div>
                )}
                {industryFeedback.areasForImprovement && (
                  <div className="rounded-md border border-border/60 p-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Areas for Improvement</p>
                    <p className="mt-1 text-sm">{industryFeedback.areasForImprovement}</p>
                  </div>
                )}
                {industryFeedback.comment && (
                  <div className="rounded-md border border-border/60 p-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Additional Comments</p>
                    <p className="mt-1 text-sm">{industryFeedback.comment}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                No feedback yet. The industry supervisor has been notified and is expected to provide feedback on the student&apos;s performance.
              </div>
            )}
          </div>

          {assessment.comment && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Your Comments
                </h3>
                <p className="text-sm">{assessment.comment}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 p-3 md:grid-cols-[220px_1fr] md:items-center">
      <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </Label>
      {typeof value === "string" ? (
        <p className="font-medium text-sm text-foreground">{value}</p>
      ) : (
        value
      )}
    </div>
  );
}
