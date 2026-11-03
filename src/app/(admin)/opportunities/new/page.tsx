import { OpportunityEditor } from "@/components/opportunities/opportunity-editor";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New opportunity" };

export default function NewOpportunityPage() {
  return <OpportunityEditor />;
}
