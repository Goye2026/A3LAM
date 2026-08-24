export function isSameOriginMutation(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const configuredSite = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configuredSite) return process.env.NODE_ENV !== "production";
  try { return new URL(origin).origin === new URL(configuredSite).origin; } catch { return false; }
}
