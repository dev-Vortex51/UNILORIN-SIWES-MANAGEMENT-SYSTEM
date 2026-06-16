import type { Assessment } from "../types";

interface StatusBadge { variant: "default" | "destructive" | "outline" | "secondary"; text: string }
interface ScoreBadge { variant: "default" | "destructive" | "outline" | "secondary"; label: string }

export function getStatusBadge(status: string): StatusBadge {
  const configs: Record<string, StatusBadge> = {
    completed: { variant: "default", text: "Completed" },
    submitted: { variant: "default", text: "Submitted" },
    pending: { variant: "secondary", text: "Pending" },
  };
  return configs[status] || { variant: "secondary", text: "Pending" };
}

export function getScoreBadge(score: number): ScoreBadge {
  if (score >= 80) return { variant: "default", label: "Excellent" };
  if (score >= 70) return { variant: "default", label: "Very Good" };
  if (score >= 60) return { variant: "outline", label: "Good" };
  if (score >= 50) return { variant: "outline", label: "Fair" };
  return { variant: "destructive", label: "Poor" };
}

function getStudentName(assessment: Assessment): string {
  const s = assessment.student;
  if (!s) return "Unknown Student";
  if (s.user) return `${s.user.firstName} ${s.user.lastName}`;
  return (s as any).name || "Unknown Student";
}

function getStudentMatric(assessment: Assessment): string {
  return assessment.student?.matricNumber || "N/A";
}

function calcAverageScore(assessment: Assessment): number | undefined {
  const fields = [assessment.technical, assessment.communication, assessment.punctuality, assessment.initiative, assessment.teamwork];
  const valid = fields.filter((f) => f != null) as number[];
  if (!valid.length) return undefined;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

export function filterAssessments(assessments: Assessment[], searchQuery: string) {
  const query = searchQuery.toLowerCase();
  if (!query) return assessments;

  return assessments.filter((assessment) => {
    const name = getStudentName(assessment).toLowerCase();
    const matric = getStudentMatric(assessment).toLowerCase();
    return name.includes(query) || matric.includes(query);
  });
}

export { getStudentName, getStudentMatric, calcAverageScore };
