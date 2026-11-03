import { CourseChatbot } from "@/components/learner/course-chatbot";
import { CourseHelpDock } from "@/components/learner/course-help-dock";
import { CourseSupportChat } from "@/components/learner/course-support-chat";

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
      <CourseHelpDock>
        <CourseSupportChat courseId={courseId} />
        <CourseChatbot courseId={courseId} />
      </CourseHelpDock>
    </>
  );
}
