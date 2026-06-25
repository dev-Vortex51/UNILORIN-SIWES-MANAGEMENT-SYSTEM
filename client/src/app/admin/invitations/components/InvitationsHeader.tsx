import { Plus, Upload } from "lucide-react";
import { PageHeader } from "@/components/design-system";
import { Button } from "@/components/ui/button";

interface InvitationsHeaderProps {
  onOpenCreate: () => void;
  onOpenBulk?: () => void;
}

export function InvitationsHeader({ onOpenCreate, onOpenBulk }: InvitationsHeaderProps) {
  return (
    <PageHeader
      title="Invitations"
      description="Manage user invitations and onboarding"
      actions={
        <div className="flex gap-2">
          {onOpenBulk ? (
            <Button variant="outline" onClick={onOpenBulk}>
              <Upload className="mr-2 h-4 w-4" />
              Bulk Invite
            </Button>
          ) : null}
          <Button onClick={onOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Send Invitation
          </Button>
        </div>
      }
    />
  );
}
