import { StudentAnalyticsWorkspace } from "@/components/student-analytics-workspace";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Learner profile" };

export default async function StudentAnalyticsPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return <StudentAnalyticsWorkspace studentId={studentId} />;
}
