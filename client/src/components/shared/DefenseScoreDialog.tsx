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
import { Button } from "@/components/ui/button";

interface DefenseScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  onSubmit: (score: number) => void;
  isSubmitting: boolean;
}

export function DefenseScoreDialog({
  open,
  onOpenChange,
  studentName,
  onSubmit,
  isSubmitting,
}: DefenseScoreDialogProps) {
  const [score, setScore] = useState("");

  const handleSubmit = () => {
    const parsed = parseInt(score, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 20) return;
    onSubmit(parsed);
    setScore("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-sm">
        <DialogHeader>
          <DialogTitle>Input Defense Score</DialogTitle>
          <DialogDescription>
            Enter defense score for <strong>{studentName}</strong> (0-20)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defense-score">Defense Score</Label>
            <Input
              id="defense-score"
              type="number"
              min={0}
              max={20}
              placeholder="0-20"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !score || parseInt(score) < 0 || parseInt(score) > 20}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Saving..." : "Save Score"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
