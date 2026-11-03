import { ResourceHub } from "@/components/staff/resource-hub";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reports" };

export default function OperationsPage() {
  return <ResourceHub section="operations" />;
}
