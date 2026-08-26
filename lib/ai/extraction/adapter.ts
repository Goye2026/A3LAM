import type { ExtractionBoundary, ExtractionWarning } from "../types";

export type AdapterExtraction = {
  rawText: string;
  pageCount: number | null;
  boundaries: ExtractionBoundary[];
  warnings: ExtractionWarning[];
  parserVersion: string;
  status: "COMPLETED" | "PARTIAL";
};
