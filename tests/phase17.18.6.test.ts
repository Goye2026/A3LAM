import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { demoFacts, demoExtraction, runEditorialDemo } from "@/components/a3lam/ai/editorialDemo";

const componentPath = resolve(process.cwd(), "components/a3lam/ai/A3lamEditorialWorkspace.tsx");
const routePath = resolve(process.cwd(), "app/admin/(protected)/ai/page.tsx");

describe("Phase 17.18.6 editorial workspace", () => {
  it("runs the local editorial demo through the existing generation quality gate", async () => {
    const facts = demoFacts.map((fact) => ({ ...fact, status: "ACCEPTED" as const }));
    const result = await runEditorialDemo("A3LAM_PERSON_DRAFT", "ARABIC", facts);
    expect(result.status).toBe("SUCCEEDED");
    expect(result.draftStatus).toBe("DRAFT");
    expect(result.qualityGate).toBe("PASS_WITH_REVIEW");
    expect(result.claims).toHaveLength(facts.length);
    expect(result.claims.every((claim) => claim.status === "NEEDS_VERIFICATION")).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/personId|profileId|published/iu);
  });

  it("keeps the demo bounded and source/evidence-aware", () => {
    expect(demoExtraction.text.length).toBeLessThan(10_000);
    expect(demoExtraction.sections.length).toBeGreaterThan(0);
    expect(demoExtraction.paragraphs.length).toBeGreaterThan(0);
    expect(demoFacts.every((fact) => fact.source && fact.evidence && fact.provenance)).toBe(true);
  });

  it("exposes accessible seven-step navigation and refuses production mutation semantics", async () => {
    const component = await readFile(componentPath, "utf8");
    const route = await readFile(routePath, "utf8");
    for (const label of ["ai-stepper", "aria-current", "aria-labelledby", "role=\"status\"", "role=\"alert\"", "details", "summary", "ai-claim-comparison", "ai-quality-grid"]) expect(component).toContain(label);
    expect(component).toContain("adminAiRunIsolatedDemo");
    expect(component).not.toContain("fetch(");
    expect(component).not.toMatch(/onClick[^\n]*(?:publish|publication)/iu);
    expect(component).not.toContain("Person Created");
    expect(route).toContain("getAdminPageAccess");
    expect(route).toContain("A3lamEditorialWorkspace");
  });
});
