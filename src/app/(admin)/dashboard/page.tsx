import { StaffDashboard } from "@/components/staff/staff-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return <StaffDashboard />;
}
