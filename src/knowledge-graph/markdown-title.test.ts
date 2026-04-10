import { describe, expect, it } from "vitest";

import { titleFromFirstHeading } from "./markdown-title.js";

describe("titleFromFirstHeading", () => {
  it("uses first # heading", () => {
    expect(titleFromFirstHeading("# Hello\n\nbody", "x")).toBe("Hello");
  });

  it("falls back to page id", () => {
    expect(titleFromFirstHeading("no heading", "fallback")).toBe("fallback");
  });
});
