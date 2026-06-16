import { Plus } from "lucide-react";
import { PageHeader } from "@/components/design-system";
import { Button } from "@/components/ui/button";

interface AssessmentsHeaderProps {
  onCreateClick: () => void;
}

export function AssessmentsHeader({ onCreateClick }: AssessmentsHeaderProps) {
  return (
    <PageHeader
      title="Student Assessments"
      description="Create and manage workplace performance assessments"
      actions={
        <Button onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          New Assessment
        </Button>
      }
    />
  );
}
