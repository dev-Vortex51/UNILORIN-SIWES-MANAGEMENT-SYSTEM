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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
  const [score, setScore] = useState("");
  const [createAssessment, setCreateAssessment] = useState(false);
  const [assessmentType, setAssessmentType] = useState("departmental");
  const [technical, setTechnical] = useState("");
  const [communication, setCommunication] = useState("");
  const [punctuality, setPunctuality] = useState("");
  const [initiative, setInitiative] = useState("");
  const [teamwork, setTeamwork] = useState("");

  if (!visit) return null;

  const studentName = `${visit.student?.user?.firstName || ""} ${visit.student?.user?.lastName || ""}`.trim();

  const handleSubmit = () => {
    const payload: any = {};

    if (feedback) payload.feedback = feedback;
    if (score) payload.score = parseInt(score, 10);

    if (createAssessment) {
      payload.assessment = {
        type: assessmentType,
        technical: parseInt(technical) || 0,
        communication: parseInt(communication) || 0,
        punctuality: parseInt(punctuality) || 0,
        initiative: parseInt(initiative) || 0,
        teamwork: parseInt(teamwork) || 0,
      };
    }

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Visit</DialogTitle>
          <DialogDescription>
            Provide feedback for the visit to <strong>{studentName}</strong>
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

          <div className="space-y-2">
            <Label htmlFor="visit-score">Score (0-100)</Label>
            <Input
              id="visit-score"
              type="number"
              min={0}
              max={100}
              placeholder="Optional quality score"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 rounded-md border p-3">
            <Switch
              id="create-assessment"
              checked={createAssessment}
              onCheckedChange={setCreateAssessment}
            />
            <Label htmlFor="create-assessment" className="cursor-pointer">
              Create assessment for this visit
            </Label>
          </div>

          {createAssessment && (
            <div className="space-y-4 rounded-md border p-3">
              <p className="text-sm font-medium">Assessment Scores</p>

              <div className="space-y-2">
                <Label htmlFor="assessment-type">Type</Label>
                <Select value={assessmentType} onValueChange={setAssessmentType}>
                  <SelectTrigger id="assessment-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="departmental">Departmental</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Technical (0-100)</Label>
                  <Input type="number" min={0} max={100} value={technical} onChange={(e) => setTechnical(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Communication (0-100)</Label>
                  <Input type="number" min={0} max={100} value={communication} onChange={(e) => setCommunication(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Punctuality (0-100)</Label>
                  <Input type="number" min={0} max={100} value={punctuality} onChange={(e) => setPunctuality(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Initiative (0-100)</Label>
                  <Input type="number" min={0} max={100} value={initiative} onChange={(e) => setInitiative(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Teamwork (0-100)</Label>
                  <Input type="number" min={0} max={100} value={teamwork} onChange={(e) => setTeamwork(e.target.value)} />
                </div>
              </div>
            </div>
          )}

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
