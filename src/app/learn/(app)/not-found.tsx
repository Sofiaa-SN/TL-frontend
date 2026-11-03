import { Compass } from "lucide-react";
import { StatusPage } from "@/components/status-page";

export default function LearnerNotFound() {
  return (
    <StatusPage
      icon={Compass}
      code="404"
      title="This page isn’t here"
      description="The link may be out of date, or the course may no longer be assigned to you."
      homeHref="/learn"
      homeLabel="Back to my learning"
    />
  );
}
