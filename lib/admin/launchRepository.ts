import { existsSync } from "node:fs";
import path from "node:path";
import { adminRepository } from "@/lib/data/adminRepository";
import { getMigrationRegistryStatus } from "@/lib/admin/migrationRegistry";
import { getSystemHealthSnapshot } from "@/lib/admin/systemHealth";
import { evaluatePersonReadiness, type PersonReadinessResult } from "@/lib/admin/launch";

export const LAUNCH_EDITORIAL_SAMPLE_SIZE = 8;

export type LaunchEditorialSample = {
  id: string;
  nameArabic: string;
  name: string;
  slug: string;
  lifecycle: "draft" | "review" | "published" | "archived";
  readiness: PersonReadinessResult;
};

export type LaunchControlData = {
  summary: Awaited<ReturnType<typeof adminRepository.getControlCenterSummary>> | null;
  dashboard: Awaited<ReturnType<typeof adminRepository.getDashboard>> | null;
  health: Awaited<ReturnType<typeof getSystemHealthSnapshot>> | null;
  migrations: Awaited<ReturnType<typeof getMigrationRegistryStatus>> | null;
  editorialSample: LaunchEditorialSample[];
  editorialSampleUnavailable: boolean;
  documentation: {
    backup: boolean;
    restore: boolean;
    portability: boolean;
    android: boolean;
    domain: boolean;
  };
};

export async function getLaunchControlData(): Promise<LaunchControlData> {
  const [summaryResult, dashboardResult, healthResult, migrationsResult] = await Promise.allSettled([
    adminRepository.getControlCenterSummary(),
    adminRepository.getDashboard(),
    getSystemHealthSnapshot(),
    getMigrationRegistryStatus(),
  ]);
  const summary = summaryResult.status === "fulfilled" ? summaryResult.value : null;
  const dashboard = dashboardResult.status === "fulfilled" ? dashboardResult.value : null;
  const health = healthResult.status === "fulfilled" ? healthResult.value : null;
  const migrations = migrationsResult.status === "fulfilled" ? migrationsResult.value : null;
  const recent = dashboard?.recent.slice(0, LAUNCH_EDITORIAL_SAMPLE_SIZE) ?? [];
  const editorialSampleResults = await Promise.allSettled(
    recent.map(async (item) => {
      const editor = await adminRepository.getEditorData(item.id);
      if (!editor) return null;
      return {
        id: item.id,
        nameArabic: item.nameArabic,
        name: item.name,
        slug: item.slug,
        lifecycle: item.status,
        readiness: evaluatePersonReadiness(editor.record, { mediaUrl: editor.record.person.image }),
      } satisfies LaunchEditorialSample;
    }),
  );
  const editorialSample = editorialSampleResults.flatMap((result) => result.status === "fulfilled" && result.value ? [result.value] : []);
  return {
    summary,
    dashboard,
    health,
    migrations,
    editorialSample,
    editorialSampleUnavailable: recent.length > editorialSample.length || dashboard === null,
    documentation: {
      backup: existsSync(path.join(process.cwd(), "docs", "BACKUP.md")) && existsSync(path.join(process.cwd(), "docs", "RESTORE.md")),
      restore: existsSync(path.join(process.cwd(), "docs", "RESTORE.md")),
      portability: existsSync(path.join(process.cwd(), "docs", "SELF_HOSTING.md")) && existsSync(path.join(process.cwd(), "docs", "ENVIRONMENT.md")) && existsSync(path.join(process.cwd(), "docs", "deployment", "docker.md")),
      android: existsSync(path.join(process.cwd(), "android", "README.md")) && existsSync(path.join(process.cwd(), "docs", "ANDROID_RELEASE.md")),
      domain: existsSync(path.join(process.cwd(), "docs", "DOMAIN_SETUP.md")) && existsSync(path.join(process.cwd(), "docs", "deployment", "domain.md")),
    },
  };
}
