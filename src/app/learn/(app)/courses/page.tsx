import type { Metadata } from "next";
import { LearnerCourseLibrary } from "@/components/learner/learner-course-library";

export const metadata: Metadata = { title: "My courses" };

export default function LearnerCoursesPage() {
  return <LearnerCourseLibrary />;
}
