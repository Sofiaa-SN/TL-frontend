import { ResourceHub } from "@/components/staff/resource-hub";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Media library" };

export default function MediaPage() {
  return <ResourceHub section="media" />;
}
