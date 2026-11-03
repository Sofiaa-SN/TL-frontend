import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LearnerBrand } from "./brand";

describe("LearnerBrand", () => {
  it("uses the Sofiaa logo without cropping and keeps an accessible home link", () => {
    const { container } = render(<LearnerBrand />);

    const link = screen.getByRole("link", { name: "Sofiaa learning home" });
    const image = container.querySelector("img");

    expect(link.getAttribute("href")).toBe("/learn");
    expect(image?.getAttribute("src")).toContain("logo.png");
    expect(image?.className).toContain("object-contain");
    expect(image?.parentElement?.className).not.toContain("bg-white");
  });
});
