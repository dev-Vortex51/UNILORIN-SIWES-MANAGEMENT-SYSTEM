"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AssessmentScore, StudentOption } from "../types";

interface IAssessmentCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: StudentOption[];
  selectedStudent: string;
  onStudentChange: (value: string) => void;
  scores: AssessmentScore;
  onScoresChange: (scores: AssessmentScore) => void;
  strengths: string;
  onStrengthsChange: (value: string) => void;
  areasForImprovement: string;
  onAreasForImprovementChange: (value: string) => void;
  comment: string;
  onCommentChange: (value: string) => void;
  recommendation: string;
  onRecommendationChange: (value: "excellent" | "very_good" | "good" | "fair" | "poor") => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function IAssessmentCreateDialog({
  open,
  onOpenChange,
  students,
  selectedStudent,
  onStudentChange,
  scores,
  onScoresChange,
  strengths,
  onStrengthsChange,
  areasForImprovement,
  onAreasForImprovementChange,
  comment,
  onCommentChange,
  recommendation,
  onRecommendationChange,
  onSubmit,
  isSubmitting,
}: IAssessmentCreateDialogProps) {
  const updateScore = (field: keyof AssessmentScore, value: string) => {
    onScoresChange({ ...scores, [field]: parseInt(value) || 0 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Assessment</DialogTitle>
          <DialogDescription>
            Rate the student's performance during their industrial training
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="i-student">Student</Label>
            <Select value={selectedStudent} onValueChange={onStudentChange}>
              <SelectTrigger id="i-student">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.user.firstName} {s.user.lastName} ({s.matricNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Performance Scores (0-100)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Technical Skills</Label>
                <Input type="number" min={0} max={100} value={scores.technical} onChange={(e) => updateScore("technical", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Communication</Label>
                <Input type="number" min={0} max={100} value={scores.communication} onChange={(e) => updateScore("communication", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Punctuality</Label>
                <Input type="number" min={0} max={100} value={scores.punctuality} onChange={(e) => updateScore("punctuality", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Initiative</Label>
                <Input type="number" min={0} max={100} value={scores.initiative} onChange={(e) => updateScore("initiative", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Teamwork</Label>
                <Input type="number" min={0} max={100} value={scores.teamwork} onChange={(e) => updateScore("teamwork", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="i-strengths">Strengths</Label>
            <Textarea id="i-strengths" placeholder="Student's key strengths..." value={strengths} onChange={(e) => onStrengthsChange(e.target.value)} rows={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="i-areas">Areas for Improvement</Label>
            <Textarea id="i-areas" placeholder="Areas the student can improve..." value={areasForImprovement} onChange={(e) => onAreasForImprovementChange(e.target.value)} rows={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="i-comment">Comment</Label>
            <Textarea id="i-comment" placeholder="Additional comments..." value={comment} onChange={(e) => onCommentChange(e.target.value)} rows={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="i-recommendation">Recommendation</Label>
            <Select value={recommendation} onValueChange={onRecommendationChange}>
              <SelectTrigger id="i-recommendation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="very_good">Very Good</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={isSubmitting || !selectedStudent} className="w-full sm:w-auto">
              {isSubmitting ? "Submitting..." : "Submit Assessment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
