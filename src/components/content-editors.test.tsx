import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActivityContentEditor, ExperimentConfigEditor } from "./content-editors";
import type { JsonObject } from "@/lib/structured-json";
import { chooseOption } from "@/test/choose-option";

afterEach(cleanup);

function Harness({ initial, onChange, kind }: { initial: JsonObject; onChange: (value: JsonObject) => void; kind: "content" | "experiment" }) {
  const [value, setValue] = useState(initial);
  const update = (next: JsonObject) => { setValue(next); onChange(next); };
  return kind === "content" ? <ActivityContentEditor value={value} onChange={update} /> : <ExperimentConfigEditor value={value} onChange={update} />;
}

describe("ActivityContentEditor", () => {
  it("builds blocks without JSON and keeps unknown keys", async () => {
    const onChange = vi.fn();
    render(<Harness kind="content" initial={{ custom: "kept" }} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Add block" }));
    await userEvent.type(screen.getByLabelText("Heading"), "Break-even");
    await userEvent.type(screen.getByLabelText("Body"), "Revenue equals cost.");
    expect(onChange).toHaveBeenLastCalledWith({ custom: "kept", blocks: [{ type: "text", heading: "Break-even", body: "Revenue equals cost." }] });
  });

  it("previews content with the learner renderer", async () => {
    render(<Harness kind="content" initial={{ blocks: [{ heading: "Margins", body: "Price minus cost." }] }} onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole("radio", { name: "Preview" }));
    expect(screen.getByRole("heading", { name: "Margins" })).toBeDefined();
  });

  it("keeps bullet lines while typing and tidies them on blur", async () => {
    const onChange = vi.fn();
    render(<Harness kind="content" initial={{ blocks: [{ heading: "List" }] }} onChange={onChange} />);
    const bullets = screen.getByLabelText("Bullet points");
    await userEvent.type(bullets, "One{Enter}Two{Enter}");
    expect((bullets as HTMLTextAreaElement).value).toBe("One\nTwo\n");
    await userEvent.tab();
    expect(onChange).toHaveBeenLastCalledWith({ blocks: [{ heading: "List", items: ["One", "Two"] }] });
  });
});

describe("ExperimentConfigEditor", () => {
  it("configures a GeoGebra applet and response questions", async () => {
    const onChange = vi.fn();
    render(<Harness kind="experiment" initial={{ schema_version: 1 }} onChange={onChange} />);
    await chooseOption("Interactive tool", "GeoGebra applet");
    await userEvent.type(screen.getByLabelText("GeoGebra material ID"), "abc123");
    await userEvent.click(screen.getByRole("button", { name: "Add question" }));
    await userEvent.type(screen.getByLabelText("Question 1"), "Optimal mix");
    expect(onChange).toHaveBeenLastCalledWith({
      schema_version: 1,
      renderer: "geogebra",
      renderer_config: { material_id: "abc123" },
      response_fields: [{ key: "optimal_mix", label: "Optimal mix", type: "textarea" }],
    });
  });
});
