import{CurriculumEditor}from"@/components/curriculum-editor";export default async function CoursePage({params}:{params:Promise<{courseId:string}>}){return <CurriculumEditor courseId={(await params).courseId}/>}

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit course" };