"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceService } from "@/services/attendance.service";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function AttendanceCheckIn() {
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [loc, setLoc] = useState<{ latitude?: number; longitude?: number }>({});

  const { data: today } = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: attendanceService.getTodayCheckIn,
  });

  const mutation = useMutation({
    mutationFn: () =>
      attendanceService.checkIn({
        notes,
        location: loc,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance", "today"] });
      setNotes("");
    },
  });

  const captureLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLoc({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    });
  };

  const checkedIn = !!today;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Daily Attendance</h3>
        {checkedIn ? (
          <Badge variant={today?.punctuality === "LATE" ? "destructive" : "default"}>
            {today?.punctuality === "LATE" ? "Late" : "Present"}
          </Badge>
        ) : (
          <Badge variant="outline">Not Checked In</Badge>
        )}
      </div>

      {checkedIn ? (
        <div className="text-sm text-muted-foreground">
          Checked in at {format(new Date(today!.checkInTime), "hh:mm a")} on{" "}
          {format(new Date(today!.date), "PPP")}.
        </div>
      ) : (
        <div className="space-y-3">
          <Textarea
            placeholder="Optional notes (what you'll work on today)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={captureLocation} type="button">
              Add Location
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Checking In..." : "Check In"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default AttendanceCheckIn;
