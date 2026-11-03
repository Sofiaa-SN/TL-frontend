import { ResourceWorkspace } from "@/components/staff/resource-workspace";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { staffResources } from "@/lib/staff/resources";

export async function generateMetadata({ params }: { params: Promise<{ resource: string }> }): Promise<Metadata> {
  const { resource } = await params;
  return { title: staffResources[resource]?.title ?? "Not found" };
}

export default async function ManagementPage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource } = await params;
  if (resource === "career-opportunities") redirect("/opportunities");
  if (!staffResources[resource]) notFound();
  return <ResourceWorkspace resourceKey={resource} />;
}
