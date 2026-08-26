export function getSafePublicImageUrl(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
