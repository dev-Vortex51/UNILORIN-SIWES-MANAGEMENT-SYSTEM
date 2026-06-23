import type { ReactNode } from "react";
import {
  BookOpen,
  Briefcase,
  Building,
  Calendar,
  ClipboardCheck,
  GraduationCap,
  Users,
} from "lucide-react";
import { StatusBadge } from "@/components/design-system";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function StudentInformationCard({ student }: { student: any }) {
  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>Personal and academic details</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="rounded-md border border-border/60 overflow-hidden">
          <InfoRow
            label="Full Name"
            value={`${student.user?.firstName || ""} ${student.user?.lastName || ""}`.trim() || "N/A"}
            icon={<Users className="h-4 w-4" />}
          />
          <Separator />
          <InfoRow label="Matric Number" value={student.matricNumber || "N/A"} />
          <Separator />
          <InfoRow label="Level" value={student.level ? `${student.level}` : "N/A"} />
          <Separator />
          <InfoRow
            label="Department"
            value={student.department?.name || "N/A"}
            icon={<Building className="h-4 w-4" />}
          />
          <Separator />
          <InfoRow
            label="Session"
            value={student.session || "N/A"}
            icon={<GraduationCap className="h-4 w-4" />}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function PlacementDetailsCard({ placement }: { placement: any }) {
  const placementStatus = placement?.status || "No Placement";

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent/10 p-2">
              <Briefcase className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <CardTitle>Placement Details</CardTitle>
              <CardDescription>Industrial training placement information</CardDescription>
            </div>
          </div>
          <StatusBadge status={placementStatus} />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {placement ? (
          <div className="rounded-md border border-border/60 overflow-hidden">
            <InfoRow
              label="Company Name"
              value={placement.companyName || "N/A"}
              icon={<Building className="h-4 w-4" />}
            />
            <Separator />
            <InfoRow label="Company Address" value={placement.companyAddress || "N/A"} />
            <Separator />
            <InfoRow
              label="Start Date"
              value={placement.startDate ? new Date(placement.startDate).toLocaleDateString() : "N/A"}
              icon={<Calendar className="h-4 w-4" />}
            />
            <Separator />
            <InfoRow
              label="End Date"
              value={placement.endDate ? new Date(placement.endDate).toLocaleDateString() : "N/A"}
              icon={<Calendar className="h-4 w-4" />}
            />
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">No placement registered yet.</div>
        )}
      </CardContent>
    </Card>
  );
}

export function LogbookOverviewCard({ logbookEntries }: { logbookEntries: any[] }) {
  const total = logbookEntries.length;
  const pending = logbookEntries.filter((entry) => {
    const reviewStatus = entry.departmentalReview?.status || entry.departmentalReviewStatus;
    return entry.status === "submitted" && reviewStatus === "submitted";
  }).length;
  const approved = logbookEntries.filter((entry) => {
    const reviewStatus = entry.departmentalReview?.status || entry.departmentalReviewStatus;
    return reviewStatus === "approved";
  }).length;

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="border-b border-border/60">
        <CardTitle>Logbook Overview</CardTitle>
        <CardDescription>Submission and review status summary</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricTile title="Total Entries" value={total} icon={<BookOpen className="h-4 w-4 text-primary" />} />
          <MetricTile
            title="Pending Reviews"
            value={pending}
            icon={<ClipboardCheck className="h-4 w-4 text-amber-600" />}
            valueClassName="text-amber-700"
          />
          <MetricTile
            title="Approved Entries"
            value={approved}
            icon={<ClipboardCheck className="h-4 w-4 text-emerald-600" />}
            valueClassName="text-emerald-700"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentLogbookEntriesCard({ logbookEntries }: { logbookEntries: any[] }) {
  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="border-b border-border/60">
        <CardTitle>Recent Logbook Entries</CardTitle>
        <CardDescription>Latest weekly activity logs</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {logbookEntries.length > 0 ? (
          <div className="space-y-2">
            {logbookEntries.slice(0, 5).map((entry: any) => {
              const reviewStatus =
                entry.departmentalReview?.status ||
                entry.departmentalReviewStatus ||
                entry.status ||
                "draft";
              const statusMap: Record<string, string> = {
                approved: "approved",
                submitted: "submitted",
                reviewed: "reviewed",
                rejected: "rejected",
                draft: "draft",
              };

              return (
                <div key={entry.id} className="rounded-md border border-border/60 bg-muted/20 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Week {entry.weekNumber}</p>
                        <StatusBadge status={statusMap[reviewStatus] || "draft"} />
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                        {entry.tasksPerformed || "No tasks recorded"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {entry.startDate && entry.endDate
                          ? `${new Date(entry.startDate).toLocaleDateString()} - ${new Date(entry.endDate).toLocaleDateString()}`
                          : "N/A"}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.submittedAt
                        ? `Submitted ${new Date(entry.submittedAt).toLocaleDateString()}`
                        : "Not submitted"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <BookOpen className="mx-auto mb-4 h-10 w-10 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No logbook entries yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricTile({
  title,
  value,
  icon,
  valueClassName,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/20 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="mt-1 flex items-center gap-2">
        {icon}
        <span className={`text-lg font-semibold text-foreground ${valueClassName || ""}`}>{value}</span>
      </div>
    </div>
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
