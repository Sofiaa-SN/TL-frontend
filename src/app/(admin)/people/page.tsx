import { PeopleWorkspace } from "@/components/people-workspace";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Staff directory" };

export default function PeoplePage() { return <PeopleWorkspace />; }
