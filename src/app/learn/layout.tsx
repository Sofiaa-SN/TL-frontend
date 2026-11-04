import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Learn",
    template: "%s · Sofiaa",
  },
  description: "Your Sofiaa courses, activities, learning checks and opportunities.",
};

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
