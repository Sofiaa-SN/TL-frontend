import { AccessWorkspace } from "@/components/staff/access-workspace";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Access & roles" };

export default function AccessPage() {
  return <AccessWorkspace />;
}
