import { ResourceHub } from "@/components/staff/resource-hub";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Learners" };

export default function LearnersPage() {
  return <ResourceHub section="learners" />;
}
