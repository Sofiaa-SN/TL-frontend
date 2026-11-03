import { ApplicantReview } from "@/components/opportunities/applicant-review";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Applicants" };

export default async function OpportunityApplicationsPage({ params }: { params: Promise<{ opportunityId: string }> }) {
  const { opportunityId } = await params;
  return <ApplicantReview opportunityId={opportunityId} />;
}
