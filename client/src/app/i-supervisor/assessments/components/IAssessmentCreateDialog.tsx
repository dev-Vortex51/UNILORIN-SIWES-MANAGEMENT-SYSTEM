"use client";

import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { StudentOption } from "../types";

interface IAssessmentCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: StudentOption[];
  selectedStudent: string;
  onStudentChange: (value: string) => void;
  technical: string;
  onTechnicalChange: (value: string) => void;
  initiative: string;
  onInitiativeChange: (value: string) => void;
  professionalism: string;
  onProfessionalismChange: (value: string) => void;
  communication: string;
  onCommunicationChange: (value: string) => void;
  strengths: string;
  onStrengthsChange: (value: string) => void;
  areasForImprovement: string;
  onAreasForImprovementChange: (value: string) => void;
  comment: string;
  onCommentChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function IAssessmentCreateDialog({
  open,
  onOpenChange,
  students,
  selectedStudent,
  onStudentChange,
  technical,
  onTechnicalChange,
  initiative,
  onInitiativeChange,
  professionalism,
  onProfessionalismChange,
  communication,
  onCommunicationChange,
  strengths,
  onStrengthsChange,
  areasForImprovement,
  onAreasForImprovementChange,
  comment,
  onCommentChange,
  onSubmit,
  isSubmitting,
}: IAssessmentCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Student Assessment</DialogTitle>
          <DialogDescription>
            Evaluate the student&apos;s performance during their industrial training.
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

          <div className="rounded-md border p-3 space-y-3">
            <p className="text-sm font-medium">Assessment Scores</p>

            <div className="space-y-2">
              <Label htmlFor="i-technical">Technical Competence (0-100)</Label>
              <Input id="i-technical" type="number" min={0} max={100} placeholder="0-100" value={technical} onChange={(e) => onTechnicalChange(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="i-initiative">Initiative &amp; Problem Solving (0-100)</Label>
              <Input id="i-initiative" type="number" min={0} max={100} placeholder="0-100" value={initiative} onChange={(e) => onInitiativeChange(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="i-professionalism">Professional Conduct (0-100)</Label>
              <Input id="i-professionalism" type="number" min={0} max={100} placeholder="0-100" value={professionalism} onChange={(e) => onProfessionalismChange(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="i-communication">Communication &amp; Teamwork (0-100)</Label>
              <Input id="i-communication" type="number" min={0} max={100} placeholder="0-100" value={communication} onChange={(e) => onCommunicationChange(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="i-strengths">Strengths</Label>
            <Textarea id="i-strengths" placeholder="Student's key strengths..." value={strengths} onChange={(e) => onStrengthsChange(e.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="i-areas">Areas for Improvement</Label>
            <Textarea id="i-areas" placeholder="Areas the student can improve..." value={areasForImprovement} onChange={(e) => onAreasForImprovementChange(e.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="i-comment">Additional Comments</Label>
            <Textarea id="i-comment" placeholder="Any other comments..." value={comment} onChange={(e) => onCommentChange(e.target.value)} rows={3} />
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
