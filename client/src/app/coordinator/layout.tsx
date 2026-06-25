"use client";

import { ReactNode } from "react";
import DashboardShell from "@/components/layouts/dashboard-shell";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCheck,
  FileText,
  Settings,
  Mail,
  CalendarDays,
  Award,
} from "lucide-react";

const navItems = [
  { title: "Dashboard", href: "/coordinator/dashboard", icon: LayoutDashboard },
  { title: "Invitations", href: "/coordinator/invitations", icon: Mail },
  { title: "Students", href: "/coordinator/students", icon: Users },
  { title: "Placements", href: "/coordinator/placements", icon: Briefcase },
  { title: "Supervisors", href: "/coordinator/supervisors", icon: UserCheck },
  { title: "Visits", href: "/coordinator/visits", icon: CalendarDays },
  { title: "Grades", href: "/coordinator/grades", icon: Award },
  { title: "Reports", href: "/coordinator/reports", icon: FileText },
  { title: "Settings", href: "/coordinator/settings", icon: Settings },
];

export default function CoordinatorLayout({ children }: { children: ReactNode }) {
  return (
    <NotificationProvider>
      <DashboardShell title="Coordinator Dashboard" navItems={navItems}>
        {children}
      </DashboardShell>
    </NotificationProvider>
  );
}
