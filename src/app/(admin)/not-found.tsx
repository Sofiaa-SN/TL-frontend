import { Compass } from "lucide-react";
import { StatusPage } from "@/components/status-page";

export default function StaffNotFound() {
  return (
    <StatusPage
      icon={Compass}
      code="404"
      title="We couldn’t find that page"
      description="The link may be out of date, or the page may have moved. Head back to your dashboard to keep going."
      homeHref="/dashboard"
      homeLabel="Back to dashboard"
    />
  );
}
