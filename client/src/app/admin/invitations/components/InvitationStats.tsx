import { DashboardMetricsGrid } from "@/components/design-system";
import type { InvitationStats as InvitationStatsType } from "../types";

interface InvitationStatsProps {
  stats: InvitationStatsType;
}

export function InvitationStats({ stats }: InvitationStatsProps) {
  const metrics = [
    {
      label: "All Invitations",
      value: stats.total,
      hint: "All invitation records",
      trend: "neutral" as const,
    },
    {
      label: "Pending",
      value: stats.pending,
      hint: "Awaiting recipient action",
      trend: "up" as const,
    },
    {
      label: "Accepted",
      value: stats.accepted,
      hint: "Completed onboarding",
      trend: "up" as const,
    },
    {
      label: "Acceptance Rate",
      value:
        stats.total > 0
          ? `${Math.round((stats.accepted / stats.total) * 100)}%`
          : "0%",
      hint: "Accepted out of total",
      trend: "up" as const,
    },
  ];

  return <DashboardMetricsGrid items={metrics} />;
}
