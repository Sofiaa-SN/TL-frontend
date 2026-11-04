import { CourseHelp } from "@/components/learner/course-help";

export default async function LearnerCourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return (
    <>
      {children}
      <CourseHelp key={courseId} courseId={courseId} />
    </>
  );
}
