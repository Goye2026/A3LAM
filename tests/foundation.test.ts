import { describe, expect, it } from "vitest";
import { defaultLocale, fallbackLocale, locales } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { createCorrelationId, redactPII } from "@/lib/observability/logger";
import { getHealthResponse } from "@/lib/observability/health";

describe("localization foundation", () => {
  it("keeps Arabic as the default locale with English registered", () => {
    expect(locales).toEqual(["ar", "en"]);
    expect(defaultLocale).toBe("ar");
    expect(fallbackLocale).toBe("ar");
    expect(getMessages("ar").brandName).toBe("أساس النظام");
    expect(getMessages("en").brandName).toBe("System foundation");
  });
});

describe("observability foundation", () => {
  it("redacts sensitive keys and preserves safe context", () => {
    expect(
      redactPII({ email: "private@example.com", nested: { token: "secret", ok: true } }),
    ).toEqual({ email: "[REDACTED]", nested: { token: "[REDACTED]", ok: true } });
  });

  it("creates a correlation id and safe health response", () => {
    expect(createCorrelationId()).toMatch(/^[0-9a-f-]{36}$/);
    expect(getHealthResponse().status).toBe("ok");
    expect(getHealthResponse().service).toBe("a3lam-phase02-foundation");
  });
});
