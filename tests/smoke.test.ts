import { describe, expect, it } from "vitest";

describe("foundation", () => {
  it("keeps the foundation domain-neutral", () => {
    const foundationMarkers = ["rtl", "localization", "tokens", "accessibility"];
    expect(foundationMarkers).toHaveLength(4);
    expect(foundationMarkers).not.toContain("person");
    expect(foundationMarkers).not.toContain("search");
  });
});
