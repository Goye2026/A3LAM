import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getAdminPrincipal, ADMIN_SESSION_COOKIE } from "@/lib/admin/auth";
import { hasEffectiveAdminPermission } from "@/lib/admin/rbac";
import { getSystemHealthSnapshot } from "@/lib/admin/systemHealth";
import { MediaSchemaUnavailableError, listMediaAssets } from "@/lib/media/repository";
import type { MediaAssetListItem } from "@/lib/media/types";
import { getStorageProviderState } from "@/lib/storage/provider";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { MediaLibraryClient } from "@/components/a3lam/MediaLibraryClient";

export const metadata: Metadata = { title: "Media · A3LAM", robots: { index: false, follow: false } };

export default async function AdminMediaPage() {
  const copy = getMessages(defaultLocale);
  const principal = await getAdminPrincipal((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!principal || !(await hasEffectiveAdminPermission(principal, "media.read"))) return <div className="admin-route"><p className="admin-alert" role="alert">{copy.adminUnauthorized}</p></div>;
  const health = await getSystemHealthSnapshot();
  let items: MediaAssetListItem[] = [];
  let schemaReady = true;
  try { items = await listMediaAssets(); } catch (error) { if (error instanceof MediaSchemaUnavailableError) schemaReady = false; }
  const provider = getStorageProviderState();
  return <div className="admin-route"><header className="admin-route-heading"><div><p className="eyebrow">{copy.adminProductGroup}</p><h1>{copy.adminMediaLibrary}</h1><p className="route-description">{copy.adminMediaProvider}</p></div></header><section className="admin-stat-grid"><div className="admin-stat-card"><span>{copy.adminMediaProvider}</span><strong>{provider === "configured" ? copy.adminAvailable : copy.adminRequiresConfiguration}</strong></div><div className="admin-stat-card"><span>{copy.adminMedia}</span><strong>{health.media.assets === null ? "—" : health.media.assets}</strong></div><div className="admin-stat-card"><span>{copy.adminMigrationStatus}</span><strong>{health.migrations.pending ? copy.adminMigrationPending : copy.adminMigrationApplied}</strong></div></section><p className="admin-field-hint">{copy.adminMediaSafetyNote}</p><MediaLibraryClient copy={copy} initialItems={items} provider={provider} schemaReady={schemaReady} /></div>;
}
