import { ReportsWorkspace } from "@/components/staff/reports-workspace";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reports" };

export default function OperationsPage() {
  return <ReportsWorkspace />;
}
