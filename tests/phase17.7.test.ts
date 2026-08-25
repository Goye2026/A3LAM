import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("Phase 17.7 portability artifacts", () => {
  it("keeps environment templates placeholder-only", () => {
    const env = read(".env.example");
    expect(env).toContain("DATABASE_URL=postgresql://DB_USER:DB_PASSWORD@DB_HOST:5432/DB_NAME");
    expect(env).toContain("A3LAM_ADMIN_ACCESS_TOKEN=replace-with-a-random-32-plus-character-secret");
    expect(env).not.toContain("postgres://a3lam:a3lam@localhost");
    expect(env).not.toMatch(/^A3LAM_ADMIN_ACCESS_TOKEN=(?!replace-with)/m);
  });

  it("defines a portable Node image and a health-gated Compose service", () => {
    const dockerfile = read("Dockerfile");
    const compose = read("docker-compose.yml");
    expect(dockerfile).toContain("COPY --from=builder /app/.next ./.next");
    expect(dockerfile).toContain('CMD ["pnpm", "start"]');
    expect(compose).toContain("condition: service_healthy");
    expect(compose).toContain("a3lam-postgres-data:");
    expect(compose).toContain("/api/health");
  });

  it("documents Android without placing secrets in the wrapper contract", () => {
    const android = read("android/README.md");
    const androidConfig = read("android/capacitor.config.example.json");
    expect(android).toContain("org.a3lam.app");
    expect(androidConfig).toContain('"appId": "org.a3lam.app"');
    expect(androidConfig).toContain('"cleartext": false');
    expect(android).toContain("REQUIRES DEVICE VERIFICATION");
    expect(android).toContain("DATABASE_URL");
    expect(android).toContain("A3LAM_ADMIN_ACCESS_TOKEN");
  });
});
