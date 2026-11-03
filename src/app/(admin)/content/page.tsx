import { ResourceHub } from "@/components/staff/resource-hub";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Content library" };

export default function ContentPage() {
  return <ResourceHub section="content" />;
}
