"use client";

import { useState } from "react";
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
import type { Visit } from "../types";

interface CompleteVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: Visit | null;
  onSubmit: (payload: any) => void;
  isSubmitting: boolean;
}

export function CompleteVisitDialog({ open, onOpenChange, visit, onSubmit, isSubmitting }: CompleteVisitDialogProps) {
  const [feedback, setFeedback] = useState("");
  const [understandingScore, setUnderstandingScore] = useState("");
  const [relevanceScore, setRelevanceScore] = useState("");
  const [industryFeedback, setIndustryFeedback] = useState("");
  const [professionalism, setProfessionalism] = useState("");

  if (!visit) return null;

  const studentName = `${visit.student?.user?.firstName || ""} ${visit.student?.user?.lastName || ""}`.trim();

  const handleSubmit = () => {
    const payload: Record<string, unknown> = {};
    if (feedback) payload.feedback = feedback;
    if (understandingScore) payload.understandingScore = parseInt(understandingScore, 10);
    if (relevanceScore) payload.relevanceScore = parseInt(relevanceScore, 10);
    if (industryFeedback) payload.industryFeedback = parseInt(industryFeedback, 10);
    if (professionalism) payload.professionalism = parseInt(professionalism, 10);
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Visit — Final Visitation Evaluation</DialogTitle>
          <DialogDescription>
            Evaluate the student for <strong>{studentName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="visit-feedback">Feedback</Label>
            <Textarea
              id="visit-feedback"
              placeholder="Notes about the visit..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          </div>

          <div className="rounded-md border p-3 space-y-3">
            <p className="text-sm font-medium">Final Visitation Evaluation Criteria</p>

            <div className="space-y-2">
              <Label htmlFor="understanding-score">Understanding of Work (0-5)</Label>
              <Input
                id="understanding-score"
                type="number"
                min={0}
                max={5}
                placeholder="0-5"
                value={understandingScore}
                onChange={(e) => setUnderstandingScore(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relevance-score">Relevance of Work (0-5)</Label>
              <Input
                id="relevance-score"
                type="number"
                min={0}
                max={5}
                placeholder="0-5"
                value={relevanceScore}
                onChange={(e) => setRelevanceScore(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry-feedback">Industry Feedback (0-3)</Label>
              <Input
                id="industry-feedback"
                type="number"
                min={0}
                max={3}
                placeholder="0-3"
                value={industryFeedback}
                onChange={(e) => setIndustryFeedback(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="professionalism">Professionalism (0-2)</Label>
              <Input
                id="professionalism"
                type="number"
                min={0}
                max={2}
                placeholder="0-2"
                value={professionalism}
                onChange={(e) => setProfessionalism(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Completing..." : "Complete Visit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
