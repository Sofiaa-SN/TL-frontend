import { ResourceHub } from "@/components/staff/resource-hub";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Assessments" };

export default function AssessmentsPage() {
  return <ResourceHub section="assessments" />;
}
