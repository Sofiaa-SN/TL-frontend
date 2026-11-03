"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { StatusPage } from "@/components/status-page";

export default function StaffError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <StatusPage
      icon={TriangleAlert}
      title="Something went wrong"
      description="This page hit an unexpected problem. Your saved work is safe. Try again, or return to the dashboard."
      homeHref="/dashboard"
      homeLabel="Back to dashboard"
      onRetry={retry}
    />
  );
}
