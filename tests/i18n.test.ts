import { describe, expect, it } from "vitest";
import { resolveFoundationMessage, resolveMessage } from "@/lib/i18n/resolve";
import { getPublicMessages } from "@/lib/i18n/messages";

const catalogs = {
  ar: {
    greeting: "مرحبًا",
    items: { one: "عنصر واحد", other: "{count} عناصر" },
  },
  en: {
    greeting: "Hello",
    items: { one: "one item", other: "{count} items" },
  },
} as const;

describe("localization resolution", () => {
  it("resolves a normal Arabic message", () => {
    expect(resolveMessage("greeting", catalogs, { locale: "ar" })).toMatchObject({
      value: "مرحبًا",
      locale: "ar",
      usedFallback: false,
      missing: false,
    });
  });

  it("resolves a normal English message", () => {
    expect(resolveMessage("greeting", catalogs, { locale: "en" })).toMatchObject({
      value: "Hello",
      locale: "en",
      usedFallback: false,
      missing: false,
    });
  });

  it("resolves pluralized messages deterministically", () => {
    expect(resolveMessage("items", catalogs, { locale: "en", count: 1 }).value).toBe("one item");
    expect(resolveMessage("items", catalogs, { locale: "en", count: 3 }).value).toBe("{count} items");
    expect(resolveFoundationMessage("foundationItems", { locale: "ar", count: 2 }).value).toBe("عينتان");
  });

  it("returns an explicit deterministic missing-key marker", () => {
    expect(resolveMessage("missing.key", catalogs, { locale: "ar" })).toMatchObject({
      value: "[missing:missing.key]",
      missing: true,
      usedFallback: false,
    });
  });

  it("keeps admin-only copy out of the public message projection", () => {
    const publicMessages = getPublicMessages("ar");
    expect("adminAi" in publicMessages).toBe(false);
    expect("adminAiPrivacyNotice" in publicMessages).toBe(false);
    expect(publicMessages.statsPeople).toBeTruthy();
  });

  it("uses the configured locale fallback when the primary key is absent", () => {
    const result = resolveMessage("onlyArabic", { ar: { onlyArabic: "عربي" }, en: {} }, { locale: "en" });
    expect(result).toMatchObject({
      value: "عربي",
      locale: "ar",
      usedFallback: true,
      missing: false,
    });
  });
});
