import { Compass } from "lucide-react";
import { StatusPage } from "@/components/status-page";

export default function NotFound() {
  return (
    <div className="brand-backdrop flex min-h-screen items-center">
      <StatusPage
        icon={Compass}
        code="404"
        title="Page not found"
        description="The page you’re looking for doesn’t exist or has moved."
        homeHref="/"
        homeLabel="Go to Sofiaa"
      />
    </div>
  );
}
