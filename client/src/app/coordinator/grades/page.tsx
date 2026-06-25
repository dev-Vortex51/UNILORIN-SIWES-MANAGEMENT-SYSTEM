"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gradeService, type FinalGrade } from "@/services/grade.service";
import { DefenseScoreDialog } from "@/components/shared/DefenseScoreDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AtlassianTable,
  type AtlassianTableColumn,
  FilterBar,
  FilterFieldSearch,
  PageHeader,
  LoadingPage,
} from "@/components/design-system";
import { Download, RotateCw, Swords, Lock } from "lucide-react";

export default function CoordinatorGradesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [defenseStudent, setDefenseStudent] = useState<FinalGrade | null>(null);
  const [defenseOpen, setDefenseOpen] = useState(false);

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ["grades"],
    queryFn: () => gradeService.getAllGrades(),
  });

  const recalculateMutation = useMutation({
    mutationFn: (studentId: string) => gradeService.recalculateGrade(studentId),
    onSuccess: () => {
      toast.success("Grade recalculated");
      queryClient.invalidateQueries({ queryKey: ["grades"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Recalculation failed"),
  });

  const defenseMutation = useMutation({
    mutationFn: ({ studentId, score }: { studentId: string; score: number }) =>
      gradeService.inputDefenseScore(studentId, score),
    onSuccess: () => {
      toast.success("Defense score saved");
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      setDefenseOpen(false);
      setDefenseStudent(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to save defense score"),
  });

  const finalizeMutation = useMutation({
    mutationFn: (studentId: string) => gradeService.finalizeGrade(studentId),
    onSuccess: () => {
      toast.success("Grade finalized");
      queryClient.invalidateQueries({ queryKey: ["grades"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Finalization failed"),
  });

  const filtered = search
    ? grades.filter((g) => {
        const name = `${g.student?.user?.firstName ?? ""} ${g.student?.user?.lastName ?? ""}`.toLowerCase();
        const matric = g.student?.matricNumber?.toLowerCase() ?? "";
        const q = search.toLowerCase();
        return name.includes(q) || matric.includes(q);
      })
    : grades;

  const columns: AtlassianTableColumn<FinalGrade>[] = [
    { id: "student", header: "Student", render: (g) => (
      <div>
        <p className="font-medium text-sm">{g.student?.user?.firstName} {g.student?.user?.lastName}</p>
        <p className="text-xs text-muted-foreground">{g.student?.matricNumber}</p>
      </div>
    )},
    { id: "department", header: "Dept", render: (g) => (
      <span className="text-xs">{g.student?.department?.code ?? "—"}</span>
    )},
    { id: "logbook", header: "Logbook (50)", render: (g) => (
      <span className="text-sm font-medium">{g.entryCompletion + g.industryReview + g.submissionConsistency + g.visitationEval}</span>
    )},
    { id: "industry", header: "Industry (30)", render: (g) => (
      <span className="text-sm font-medium">{g.attendanceScore + g.technical + g.initiative + g.conduct + g.communication}</span>
    )},
    { id: "defense", header: "Defense (20)", render: (g) => (
      <span className="text-sm font-medium">{g.defenseScore}</span>
    )},
    { id: "total", header: "Total", render: (g) => (
      <span className="text-sm font-bold">{g.totalScore}</span>
    )},
    { id: "grade", header: "Grade", render: (g) => (
      <Badge variant={g.grade === "A" ? "default" : "secondary"}>{g.grade || "—"}</Badge>
    )},
    { id: "status", header: "Status", render: (g) => (
      <Badge variant={g.isFinalized ? "default" : "outline"} className="text-xs">
        {g.isFinalized ? "Finalized" : "Provisional"}
      </Badge>
    )},
    { id: "actions", header: "Actions", render: (g) => (
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" className="h-7 w-7" title="Recalculate"
          onClick={() => recalculateMutation.mutate(g.studentId)}
          disabled={recalculateMutation.isPending}
        >
          <RotateCw className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" title="Input Defense Score"
          onClick={() => { setDefenseStudent(g); setDefenseOpen(true); }}
        >
          <Swords className="h-3.5 w-3.5" />
        </Button>
        {!g.isFinalized && (
          <Button size="icon" variant="ghost" className="h-7 w-7" title="Finalize"
            onClick={() => finalizeMutation.mutate(g.studentId)}
            disabled={finalizeMutation.isPending}
          >
            <Lock className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    )},
  ];

  if (isLoading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Grades"
        description="View, recalculate, and finalize student grades"
        actions={
          <Button variant="outline" size="sm" onClick={() => gradeService.exportCsv()}>
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
        }
      />

      <FilterBar>
        <FilterFieldSearch
          placeholder="Search by name or matric..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </FilterBar>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {grades.length === 0
              ? "No grades found. Recalculate a student's grade first."
              : "No matching students."}
          </CardContent>
        </Card>
      ) : (
        <AtlassianTable
          columns={columns}
          data={filtered}
          rowKey={(g) => g.id}
          emptyTitle="No grades"
          emptyDescription="Recalculate a student's grade to see results here."
        />
      )}

      {defenseStudent && (
        <DefenseScoreDialog
          open={defenseOpen}
          onOpenChange={(o) => { setDefenseOpen(o); if (!o) setDefenseStudent(null); }}
          studentName={`${defenseStudent.student?.user?.firstName ?? ""} ${defenseStudent.student?.user?.lastName ?? ""}`}
          onSubmit={(score) => defenseMutation.mutate({ studentId: defenseStudent.studentId, score })}
          isSubmitting={defenseMutation.isPending}
        />
      )}
    </div>
  );
}
