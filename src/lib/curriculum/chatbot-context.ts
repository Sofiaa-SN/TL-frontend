import type { Activity, CourseVersion } from "@/lib/curriculum/types";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function str(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sentence(...parts: string[]) {
  return parts.filter(Boolean).map((part) => /[.!?:]$/.test(part) ? part : `${part}.`).join(" ");
}

function activityText(activity: Activity) {
  const content = record(activity.content_record?.content ?? activity.content);
  const lines = [sentence(`Activity: ${activity.title}`, str(activity.description))];
  for (const raw of Array.isArray(content.blocks) ? content.blocks : []) {
    if (typeof raw === "string") { lines.push(raw.trim()); continue; }
    const block = record(raw);
    const items = (Array.isArray(block.items) ? block.items : []).map(str).filter(Boolean);
    lines.push(sentence(str(block.heading) || str(block.title), str(block.body) || str(block.text), str(block.equation), items.join("; ")));
  }
  const facilitation = record(content.facilitation);
  lines.push(sentence(str(facilitation.prompt) && `Task: ${str(facilitation.prompt)}`, str(facilitation.deliverable) && `Deliverable: ${str(facilitation.deliverable)}`));
  if (activity.experiment?.instructions) lines.push(sentence(`Instructions: ${activity.experiment.instructions.trim()}`));
  return lines.filter(Boolean).join(" ");
}

/**
 * Drafts tutor context from a course version's own material, one paragraph per
 * chapter, lesson and activity (the tutor retrieves by paragraph).
 */
export function buildApprovedContext(version: CourseVersion) {
  const paragraphs: string[] = [];
  for (const chapter of [...version.chapters].sort((a, b) => a.display_order - b.display_order)) {
    paragraphs.push(sentence(`Chapter ${chapter.chapter_number}: ${chapter.title}`, str(chapter.description)));
    for (const subtopic of [...chapter.subtopics].sort((a, b) => a.display_order - b.display_order)) {
      const objectives = (subtopic.learning_objectives ?? []).map(str).filter((objective) => objective && objective !== str(subtopic.description));
      paragraphs.push(sentence(`Lesson: ${subtopic.title}`, str(subtopic.description), objectives.length ? `Learning objectives: ${objectives.join("; ")}` : ""));
      for (const activity of [...subtopic.activities].sort((a, b) => a.display_order - b.display_order)) paragraphs.push(activityText(activity));
    }
  }
  return paragraphs.filter(Boolean).join("\n\n");
}
