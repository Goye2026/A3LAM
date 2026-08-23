import { describe, expect, it } from "vitest";
import { parseBiography } from "@/lib/a3lam/biography";

describe("parseBiography", () => {
  it("keeps paragraphs and turns section markers into headings", () => {
    expect(parseBiography("فقرة أولى.\n\n## التعليم\nفقرة ثانية.")).toEqual([
      { type: "paragraph", text: "فقرة أولى." },
      { type: "heading", text: "التعليم" },
      { type: "paragraph", text: "فقرة ثانية." },
    ]);
  });

  it("groups consecutive dash lines into a list", () => {
    expect(parseBiography("## نقاط\n- الأولى\n- الثانية")).toEqual([
      { type: "heading", text: "نقاط" },
      { type: "list", items: ["الأولى", "الثانية"] },
    ]);
  });
});
