import{StudentGroupWorkspace}from"@/components/student-group-workspace";export default async function StudentGroupPage({params}:{params:Promise<{groupId:string}>}){const{groupId}=await params;return <StudentGroupWorkspace groupId={groupId}/>}

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Student group" };