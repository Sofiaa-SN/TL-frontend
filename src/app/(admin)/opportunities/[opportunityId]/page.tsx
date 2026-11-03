import { OpportunityEditor } from "@/components/opportunities/opportunity-editor";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit opportunity" };

export default async function EditOpportunityPage({ params }: { params: Promise<{ opportunityId: string }> }) {
  const { opportunityId } = await params;
  return <OpportunityEditor opportunityId={opportunityId} />;
}
