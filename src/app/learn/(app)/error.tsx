"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { StatusPage } from "@/components/status-page";

export default function LearnerError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <StatusPage
      icon={TriangleAlert}
      title="Something went wrong"
      description="We hit a problem loading this page. Your progress is saved. Try again in a moment."
      homeHref="/learn"
      homeLabel="Back to my learning"
      onRetry={retry}
    />
  );
}
