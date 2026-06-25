"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarDays, Clock, MapPin, User, Building2, ExternalLink } from "lucide-react";
import { visitService } from "@/services/visit.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  scheduled: { label: "Scheduled", variant: "secondary" },
  completed: { label: "Completed", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const typeIcon = (type: string) => {
  if (type === "virtual") return <ExternalLink className="h-3.5 w-3.5" />;
  return <MapPin className="h-3.5 w-3.5" />;
};

export default function StudentVisitsPage() {
  const { data: visits = [], isLoading } = useQuery({
    queryKey: ["visits", "my-visits"],
    queryFn: () => visitService.getMyVisits(),
  });

  const scheduled = visits.filter((v: any) => v.status === "scheduled");
  const completed = visits.filter((v: any) => v.status === "completed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">My Visits</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scheduled and past supervision visits for your industrial training.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <CalendarDays className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{visits.length}</p>
              <p className="text-xs text-muted-foreground">Total Visits</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{scheduled.length}</p>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <MapPin className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">{completed.length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : visits.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">No visits yet</p>
            <p className="text-xs text-muted-foreground">
              Your academic supervisor will schedule visits to monitor your progress.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visits.map((visit: any) => {
            const config = statusConfig[visit.status] || statusConfig.scheduled;
            return (
              <Card key={visit.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {format(new Date(visit.visitDate), "EEEE, MMM d, yyyy")}
                        </p>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </div>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {typeIcon(visit.type)}
                        {visit.type === "virtual" ? "Virtual" : "Physical"}
                        {visit.location ? ` · ${visit.location}` : ""}
                      </p>
                      {visit.objective ? (
                        <p className="text-xs text-muted-foreground">
                          {visit.objective}
                        </p>
                      ) : null}
                      {visit.supervisor ? (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {visit.supervisor.user.firstName} {visit.supervisor.user.lastName}
                        </p>
                      ) : null}
                      {visit.placement ? (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {visit.placement.companyName}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      {visit.understandingScore !== null && visit.understandingScore !== undefined ? (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Visitation Eval</p>
                          <p className="text-lg font-bold text-foreground">
                            {(visit.understandingScore || 0) + (visit.relevanceScore || 0) + (visit.industryFeedback || 0) + (visit.professionalism || 0)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">/ 15</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {visit.feedback ? (
                    <div className="mt-3 rounded-md bg-muted/30 p-3">
                      <p className="text-[11px] font-medium text-muted-foreground">Feedback</p>
                      <p className="mt-0.5 text-xs text-foreground">{visit.feedback}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
