import type { Metadata } from "next";
import { LearnerDashboard } from "@/components/learner/learner-dashboard";

export const metadata: Metadata = { title: "My learning" };


export default function LearnerDashboardPage() {
  return <LearnerDashboard />;
}
