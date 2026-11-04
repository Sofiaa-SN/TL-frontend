import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SimpleSelect } from "./simple-select";
import { chooseOption } from "@/test/choose-option";

afterEach(cleanup);

const courses = [{ value: "c1", label: "Algebra" }, { value: "c2", label: "Statistics" }];

describe("SimpleSelect", () => {
  it("submits the chosen value through its form name", async () => {
    const onSubmit = vi.fn();
    render(
      <form onSubmit={(event) => { event.preventDefault(); onSubmit(Object.fromEntries(new FormData(event.currentTarget))); }}>
        <label htmlFor="course">Course</label>
        <SimpleSelect id="course" name="course" placeholder="Select course" options={courses} />
        <button type="submit">Save</button>
      </form>,
    );
    expect(screen.getByRole("combobox", { name: "Course" }).textContent).toContain("Select course");
    await chooseOption("Course", "Statistics");
    screen.getByRole("button", { name: "Save" }).click();
    expect(onSubmit).toHaveBeenCalledWith({ course: "c2" });
  });

  it("uses an empty-value option as the placeholder and reports it as an empty string", async () => {
    const onValueChange = vi.fn();
    render(<SimpleSelect aria-label="Teacher" value="c1" onValueChange={onValueChange} options={[{ value: "", label: "No teacher" }, ...courses]} />);
    await chooseOption("Teacher", "No teacher");
    expect(onValueChange).toHaveBeenLastCalledWith("");
  });
});
