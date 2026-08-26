export const MEDIA_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type MediaMimeType = (typeof MEDIA_MIME_TYPES)[number];
export const MEDIA_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
export type MediaExtension = (typeof MEDIA_EXTENSIONS)[number];
export type MediaAssetStatus = "ready" | "archived";
export type MediaVisibility = "private" | "public";
export type MediaUsageType = "portrait" | "secondary";
export type MediaProviderState = "configured" | "not_configured" | "invalid_configuration" | "unavailable" | "error";

export type MediaAsset = {
  id: string;
  provider: string;
  storageKey: string;
  publicUrl: string;
  originalName: string;
  mimeType: MediaMimeType;
  extension: MediaExtension;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string;
  sourceUrl: string | null;
  attribution: string;
  license: string;
  status: MediaAssetStatus;
  visibility: MediaVisibility;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MediaUsage = { personId: string; personNameArabic: string; personSlug: string; usageType: MediaUsageType; isPrimary: boolean };
export type MediaAssetListItem = MediaAsset & { usageCount: number; usages: MediaUsage[] };
