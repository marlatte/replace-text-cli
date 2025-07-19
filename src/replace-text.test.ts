import { describe, it, expect } from "vitest";
import {
  applyReplacements,
  parsePattern,
  isRegexPattern,
} from "./replace-text.ts";

describe("isRegexPattern", () => {
  it("identifies regex strings correctly", () => {
    expect(isRegexPattern("/abc/i")).toBe(true);
    expect(isRegexPattern("/abc/")).toBe(true);
    expect(isRegexPattern("not-a-regex")).toBe(false);
    expect(isRegexPattern("/missingend")).toBe(false);
  });
});

describe("parsePattern", () => {
  it("parses valid regex patterns", () => {
    const result = parsePattern("/abc/i");
    expect(result).toBeInstanceOf(RegExp);
    if (result instanceof RegExp) {
      expect(result.flags).toContain("i");
    }
  });

  it("returns strings for non-regex", () => {
    expect(parsePattern("blue")).toBe("blue");
  });
});

describe("applyReplacements", () => {
  it("replaces string literals", () => {
    const input = "color: blue;";
    const result = applyReplacements(input, [
      { from: "blue", to: "var(--blue)" },
    ]);
    expect(result).toBe("color: var(--blue);");
  });

  it("applies regex replacements", () => {
    const input = "--theme-primary: red;";
    const result = applyReplacements(input, [
      { from: /--theme-(\w+)/g, to: "--color-$1" },
    ]);
    expect(result).toBe("--color-primary: red;");
  });

  it("applies multiple rules in order", () => {
    const input = "--theme-primary: blue;";
    const result = applyReplacements(input, [
      { from: /--theme-(\w+)/g, to: "--color-$1" },
      { from: "blue", to: "var(--blue)" },
    ]);
    expect(result).toBe("--color-primary: var(--blue);");
  });

  it("leaves input unchanged if no matches", () => {
    const input = "--nothing-here: green;";
    const result = applyReplacements(input, [
      { from: /not-found/, to: "something" },
    ]);
    expect(result).toBe(input);
  });

  it("handles regex with special replacement chars", () => {
    const input = "color: blue;";
    const result = applyReplacements(input, [
      { from: /blue/, to: "var(--$&)" }, // $& inserts matched string
    ]);
    expect(result).toBe("color: var(--blue);");
  });

  it("handles bad regex as a normal string", () => {
    const input = "bad-regex";
    const result = applyReplacements(input, [
      { from: "/--bad-regex(", to: "oops" }, // invalid regex
    ]);
    expect(result).toBe(input);
  });
});
