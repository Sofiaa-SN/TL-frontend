import { describe, expect, it } from "vitest";

import { buildApprovedContext } from "./chatbot-context";
import type { CourseVersion } from "./types";

describe("buildApprovedContext", () => {
  it("writes one paragraph per chapter, lesson and activity in display order", () => {
    const version = {
      chapters: [
        { chapter_number: 2, title: "Later", description: "", display_order: 2, subtopics: [] },
        {
          chapter_number: 1, title: "Costs", description: "Fixed and variable costs", display_order: 1,
          subtopics: [{
            title: "Break-even", description: "Find the break-even point", learning_objectives: ["Find the break-even point", "Read a cost chart"], display_order: 1,
            activities: [{
              title: "Worked example", description: "", display_order: 1, experiment: null, content: null,
              content_record: { content: { blocks: [{ heading: "Formula", equation: "Q = F / (P − V)", items: ["F is fixed cost"] }], facilitation: { prompt: "Compute Q" } } },
            }],
          }],
        },
      ],
    } as unknown as CourseVersion;

    expect(buildApprovedContext(version).split("\n\n")).toEqual([
      "Chapter 1: Costs. Fixed and variable costs.",
      "Lesson: Break-even. Find the break-even point. Learning objectives: Read a cost chart.",
      "Activity: Worked example. Formula. Q = F / (P − V). F is fixed cost. Task: Compute Q.",
      "Chapter 2: Later.",
    ]);
  });
});
