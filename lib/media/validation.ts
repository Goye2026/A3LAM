import { getSafePublicImageUrl } from "@/lib/media/public";
import type { MediaVisibility } from "@/lib/media/types";

export class MediaInputError extends Error {
  constructor(message: string) { super(message); this.name = "MediaInputError"; }
}

function text(value: unknown, field: string, max: number, required = false) {
  if (typeof value !== "string") {
    if (!required && (value === null || value === undefined)) return "";
    throw new MediaInputError(`${field} must be text`);
  }
  const normalized = value.trim();
  if (required && !normalized) throw new MediaInputError(`${field} is required`);
  if (normalized.length > max) throw new MediaInputError(`${field} is too long`);
  return normalized;
}

function optionalUrl(value: unknown, field: string) {
  const normalized = text(value, field, 2000);
  if (!normalized) return null;
  const safe = getSafePublicImageUrl(normalized);
  if (!safe) throw new MediaInputError(`${field} must use http or https`);
  return safe;
}

export type MediaMetadataInput = { altText: string; sourceUrl: string | null; attribution: string; license: string; visibility: MediaVisibility };

export function parseMediaMetadataInput(value: unknown): MediaMetadataInput {
  if (!value || typeof value !== "object") throw new MediaInputError("Media metadata is invalid");
  const item = value as Record<string, unknown>;
  const visibility = text(item.visibility, "visibility", 20, true);
  if (visibility !== "private" && visibility !== "public") throw new MediaInputError("visibility is invalid");
  const result = {
    altText: text(item.altText, "altText", 500),
    sourceUrl: optionalUrl(item.sourceUrl, "sourceUrl"),
    attribution: text(item.attribution, "attribution", 1000),
    license: text(item.license, "license", 300),
    visibility,
  } as MediaMetadataInput;
  if (result.visibility === "public" && (!result.sourceUrl || !result.license)) throw new MediaInputError("Public media requires a source URL and license");
  return result;
}

export function safeStorageKey(value: string) {
  const normalized = value.trim();
  if (!/^editorial\/people\/[a-zA-Z0-9_-]+\/portrait-[a-f0-9-]+\.(jpg|jpeg|png|webp)$/.test(normalized) || normalized.includes("..")) throw new MediaInputError("storage key is invalid");
  return normalized;
}
