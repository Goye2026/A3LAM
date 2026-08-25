import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("Phase 17.8 launch hardening artifacts", () => {
  it("keeps the private-host Node baseline explicit without changing Vercel settings", () => {
    expect(read(".node-version").trim()).toBe("22.13.0");
    const packageJson = JSON.parse(read("package.json")) as { packageManager?: string; engines?: unknown };
    expect(packageJson.packageManager).toBe("pnpm@11.21.0");
    expect(packageJson.engines).toBeUndefined();
  });

  it("runs the Docker application as a non-root user and keeps health gating", () => {
    const dockerfile = read("Dockerfile");
    const compose = read("docker-compose.yml");
    expect(dockerfile).toContain("FROM node:22.13.0-bookworm-slim");
    expect(dockerfile).toContain("USER node");
    expect(dockerfile).toContain('CMD ["pnpm", "start"]');
    expect(compose).toContain("condition: service_healthy");
    expect(compose).toContain("/api/health");
  });

  it("provides practical root-level release and recovery runbooks", () => {
    for (const file of [
      "docs/LAUNCH_READINESS.md",
      "docs/DEPLOYMENT.md",
      "docs/BACKUP.md",
      "docs/RESTORE.md",
      "docs/DISASTER_RECOVERY.md",
      "docs/DOMAIN_SETUP.md",
      "docs/ANDROID_RELEASE.md",
      "docs/SELF_HOSTING.md",
      "docs/ENVIRONMENT.md",
      "docs/PRODUCTION_RUNBOOK.md",
    ]) {
      expect(read(file).length).toBeGreaterThan(200);
    }
    expect(read("docs/ANDROID_RELEASE.md")).toContain("RELEASE SIGNING = NOT CONFIGURED");
    expect(read("docs/PRODUCTION_RUNBOOK.md")).toContain("GET/HEAD-only");
  });
});
