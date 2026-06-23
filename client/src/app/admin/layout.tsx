"use client";

import { ReactNode } from "react";
import DashboardShell from "@/components/layouts/dashboard-shell";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import {
  LayoutDashboard,
  Building,
  School,
  UserCog,
  FileBarChart,
  Settings,
  Users,
  Mail,
  ScrollText,
} from "lucide-react";

const navItems = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Invitations", href: "/admin/invitations", icon: Mail },
  { title: "Faculties", href: "/admin/faculties", icon: School },
  { title: "Departments", href: "/admin/departments", icon: Building },
  { title: "Coordinators", href: "/admin/coordinators", icon: UserCog },
  {
    title: "Academic Supervisors",
    href: "/admin/academic-supervisors",
    icon: Users,
  },
  { title: "Reports", href: "/admin/reports", icon: FileBarChart },
  { title: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <NotificationProvider>
      <DashboardShell title="Admin Dashboard" navItems={navItems}>
        {children}
      </DashboardShell>
    </NotificationProvider>
  );
}
