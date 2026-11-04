import { OpportunityList } from "@/components/opportunities/opportunity-list";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Opportunities" };

export default function OpportunitiesPage() {
  return <OpportunityList />;
}
