"use client";

import { ReactNode } from "react";
import DashboardShell from "@/components/layouts/dashboard-shell";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  Clock,
  ClipboardCheck,
} from "lucide-react";

const navItems = [
  { title: "Dashboard", href: "/i-supervisor/dashboard", icon: LayoutDashboard },
  { title: "My Students", href: "/i-supervisor/students", icon: Users },
  { title: "Logbooks", href: "/i-supervisor/logbooks", icon: BookOpen },
  { title: "Attendance", href: "/i-supervisor/attendance", icon: Clock },
  { title: "Assessments", href: "/i-supervisor/assessments", icon: ClipboardCheck },
  { title: "Settings", href: "/i-supervisor/settings", icon: Settings },
];

export default function IndustrialSupervisorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <NotificationProvider>
      <DashboardShell title="Industrial Supervisor Dashboard" navItems={navItems}>
        {children}
      </DashboardShell>
    </NotificationProvider>
  );
}
