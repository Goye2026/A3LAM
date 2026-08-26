import { createGenerationRequest, runGeneration } from "@/lib/ai/generation/orchestrator";
import type { AiGenerationInput, AiGenerationResult, AiGeneratedClaim, AiGeneratedProfileDraft, AiProvider, DocumentProvenance, FactClassification } from "@/lib/ai/types";

export const EDITORIAL_DEMO_ENABLED = true as const;

export type DemoFact = {
  id: string;
  fieldPath: string;
  value: string;
  confidence: "high" | "medium" | "low" | "unknown";
  classification: FactClassification;
  status: "UNREVIEWED" | "ACCEPTED" | "EDITED" | "REJECTED" | "REQUEST_SOURCE";
  originalValue: string;
  reviewedValue?: string;
  source: string;
  evidence: string;
  location: string;
  provenance: DocumentProvenance;
};

export type DemoExtraction = {
  fileName: string;
  format: "TXT" | "PDF" | "DOCX";
  size: string;
  checksum: string;
  language: "mixed";
  processingState: "COMPLETED";
  sections: { id: string; label: string; range: string }[];
  paragraphs: { id: string; section: string; text: string }[];
  text: string;
};

export const demoExtraction: DemoExtraction = {
  fileName: "synthetic-arabic-cv.txt",
  format: "TXT",
  size: "1.2 KB",
  checksum: "synthetic-9f1b7d4a2c8e6f0d",
  language: "mixed",
  processingState: "COMPLETED",
  sections: [
    { id: "personal", label: "المعلومات الشخصية", range: "01–03" },
    { id: "education", label: "التعليم", range: "04–06" },
    { id: "experience", label: "الخبرة", range: "07–10" },
    { id: "skills", label: "المهارات", range: "11–12" },
  ],
  paragraphs: [
    { id: "p1", section: "المعلومات الشخصية", text: "الاسم: مثال عربي اصطناعي" },
    { id: "p2", section: "المعلومات الشخصية", text: "البريد: synthetic@example.test" },
    { id: "p3", section: "التعليم", text: "جامعة الاختبار — بكالوريوس علوم معلومات" },
    { id: "p4", section: "الخبرة", text: "مختبر المعرفة — محرر بيانات، 2021–2024" },
    { id: "p5", section: "المهارات", text: "تنظيم المعرفة، البحث، والتحرير" },
  ],
  text: "المعلومات الشخصية\nالاسم: مثال عربي اصطناعي\nالبريد: synthetic@example.test\n\nالتعليم\nجامعة الاختبار — بكالوريوس علوم معلومات\n\nالخبرة\nمختبر المعرفة — محرر بيانات، 2021–2024\n\nالمهارات\nتنظيم المعرفة، البحث، والتحرير",
};

export const demoConflict = {
  fieldPath: "experience.startDate",
  sourceA: { label: "المصدر A", value: "2021" },
  sourceB: { label: "المصدر B", value: "2022" },
  status: "NEEDS_HUMAN_REVIEW" as const,
};

export const demoFacts: DemoFact[] = [
  {
    id: "demo-fact-name",
    fieldPath: "identity.nativeName",
    value: "مثال عربي اصطناعي",
    confidence: "high",
    classification: "EXTRACTED",
    status: "UNREVIEWED",
    originalValue: "مثال عربي اصطناعي",
    source: "synthetic-arabic-cv.txt",
    evidence: "الاسم: مثال عربي اصطناعي",
    location: "المعلومات الشخصية · الفقرة 01",
    provenance: { sourceType: "document", documentId: "demo-document", fileName: "synthetic-arabic-cv.txt", section: "PERSONAL_INFORMATION", excerpt: "الاسم: مثال عربي اصطناعي", startOffset: 0, endOffset: 30 },
  },
  {
    id: "demo-fact-education",
    fieldPath: "education.institution",
    value: "جامعة الاختبار",
    confidence: "medium",
    classification: "NEEDS_VERIFICATION",
    status: "UNREVIEWED",
    originalValue: "جامعة الاختبار",
    source: "synthetic-arabic-cv.txt",
    evidence: "جامعة الاختبار — بكالوريوس علوم معلومات",
    location: "التعليم · الفقرة 03",
    provenance: { sourceType: "document", documentId: "demo-document", fileName: "synthetic-arabic-cv.txt", section: "EDUCATION", excerpt: "جامعة الاختبار — بكالوريوس علوم معلومات", startOffset: 88, endOffset: 131 },
  },
  {
    id: "demo-fact-role",
    fieldPath: "experience.position",
    value: "محرر بيانات",
    confidence: "high",
    classification: "EXTRACTED",
    status: "UNREVIEWED",
    originalValue: "محرر بيانات",
    source: "synthetic-arabic-cv.txt",
    evidence: "مختبر المعرفة — محرر بيانات، 2021–2024",
    location: "الخبرة · الفقرة 04",
    provenance: { sourceType: "document", documentId: "demo-document", fileName: "synthetic-arabic-cv.txt", section: "EXPERIENCE", excerpt: "مختبر المعرفة — محرر بيانات، 2021–2024", startOffset: 133, endOffset: 178 },
  },
  {
    id: "demo-fact-skills",
    fieldPath: "professional.skills",
    value: "تنظيم المعرفة، البحث، والتحرير",
    confidence: "medium",
    classification: "NEEDS_VERIFICATION",
    status: "UNREVIEWED",
    originalValue: "تنظيم المعرفة، البحث، والتحرير",
    source: "synthetic-arabic-cv.txt",
    evidence: "تنظيم المعرفة، البحث، والتحرير",
    location: "المهارات · الفقرة 05",
    provenance: { sourceType: "document", documentId: "demo-document", fileName: "synthetic-arabic-cv.txt", section: "SKILLS", excerpt: "تنظيم المعرفة، البحث، والتحرير", startOffset: 180, endOffset: 213 },
  },
];

export const generationModeDescriptions: Record<"PROFESSIONAL_CV" | "PROFESSIONAL_PROFILE" | "A3LAM_PERSON_DRAFT" | "BIOGRAPHY" | "SEO_DRAFT", string> = {
  PROFESSIONAL_CV: "ينظم الخبرات والتعليم في سيرة مهنية قابلة للمراجعة.",
  PROFESSIONAL_PROFILE: "يبني ملفًا مهنيًا تحريريًا موجزًا ومدعومًا بالمصدر.",
  A3LAM_PERSON_DRAFT: "مسودة بنية لشخصية A3LAM مستقبلية، وليست Person أو Profile منشورًا.",
  BIOGRAPHY: "يقترح سيرة مختصرة مع إبقاء كل claim تحت المراجعة.",
  SEO_DRAFT: "ينشئ حقولًا تحريرية لمسودة SEO دون نشر تلقائي.",
};

function claimFromFact(fact: DemoFact, jobId: string): AiGeneratedClaim {
  return { id: `${jobId}-${fact.id}`, fieldPath: fact.fieldPath, value: fact.reviewedValue ?? fact.value, sourceFactIds: [fact.id], evidenceIds: [`${fact.id}-evidence`], confidence: fact.confidence, classification: fact.classification, status: "NEEDS_VERIFICATION", provenance: [fact.provenance] };
}

function draftFor(request: Parameters<AiProvider["generate"]>[0]): AiGeneratedProfileDraft {
  const facts = request.input.facts.map((fact) => ({ id: fact.id, fieldPath: fact.fieldPath, value: String(fact.value), confidence: fact.confidence, classification: fact.classification, status: "UNREVIEWED" as const, originalValue: String(fact.value), source: "synthetic-arabic-cv.txt", evidence: String(fact.value), location: "Synthetic document", provenance: fact.provenance[0] }));
  const claims = facts.map((fact) => claimFromFact(fact, request.jobId));
  return { mode: request.mode, outputLanguage: request.outputLanguage, identity: { alternateNames: [] }, education: [], experience: [], positions: [], achievements: [], skills: [], languages: [], locations: [], organizations: [], publications: [], awards: [], webLinks: [], sources: [], claims };
}

export function createEditorialMockProvider(): AiProvider {
  return {
    id: "editorial-isolated-mock",
    modelId: "local-deterministic-editorial-demo",
    status: "READY",
    capabilities: { structuredOutput: true, maxInputBytes: 200_000, maxOutputTokens: 2_000, timeoutMs: 100 },
    async generate(request) {
      const draft = draftFor(request);
      return { status: "SUCCEEDED", draftStatus: "DRAFT", mode: request.mode, outputLanguage: request.outputLanguage, providerId: this.id, modelId: this.modelId, draft, claims: draft.claims, qualityGate: "PENDING" };
    },
  };
}

export async function runEditorialDemo(mode: "PROFESSIONAL_CV" | "PROFESSIONAL_PROFILE" | "A3LAM_PERSON_DRAFT" | "BIOGRAPHY" | "SEO_DRAFT", outputLanguage: "ARABIC" | "ENGLISH" | "BILINGUAL" | "SOURCE_LANGUAGE", facts: DemoFact[]): Promise<AiGenerationResult> {
  const input: AiGenerationInput = { documentId: "demo-document", sourceLanguage: "mixed", normalizedText: demoExtraction.text, facts: facts.filter((fact) => fact.status === "ACCEPTED" || fact.status === "EDITED").map((fact) => ({ id: fact.id, fieldPath: fact.fieldPath, value: fact.reviewedValue ?? fact.value, evidenceIds: [`${fact.id}-evidence`], provenance: [fact.provenance], confidence: fact.confidence, classification: fact.classification })) };
  return runGeneration(createGenerationRequest("demo-generation", mode, outputLanguage, input), createEditorialMockProvider());
}
