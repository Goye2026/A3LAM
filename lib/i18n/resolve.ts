import type { Locale } from "./config";
import { fallbackLocale } from "./config";
import { messages } from "./messages";

export type PluralCategory = "zero" | "one" | "two" | "few" | "many" | "other";
export type PluralMessages = Partial<Record<PluralCategory, string>>;
export type MessageValue = string | PluralMessages;
export type MessageCatalog = Record<string, MessageValue>;

export type ResolveOptions = {
  locale: Locale;
  fallbackLocale?: Locale;
  count?: number;
};

export type ResolveResult = {
  key: string;
  value: string;
  locale: Locale;
  usedFallback: boolean;
  missing: boolean;
};

const missingValue = (key: string): string => `[missing:${key}]`;

function selectPluralCategory(locale: Locale, count: number): PluralCategory {
  return new Intl.PluralRules(locale).select(count) as PluralCategory;
}

function resolveValue(value: MessageValue | undefined, locale: Locale, count?: number): string | undefined {
  if (typeof value === "string") return value;
  if (value === undefined || count === undefined) return undefined;

  const category = selectPluralCategory(locale, count);
  return value[category] ?? value.other;
}

function lookup(catalog: MessageCatalog, key: string, locale: Locale, count?: number): string | undefined {
  return resolveValue(catalog[key], locale, count);
}

export function resolveMessage(
  key: string,
  catalogs: Record<Locale, MessageCatalog>,
  options: ResolveOptions,
): ResolveResult {
  const fallback = options.fallbackLocale ?? fallbackLocale;
  const primaryValue = lookup(catalogs[options.locale], key, options.locale, options.count);

  if (primaryValue !== undefined) {
    return { key, value: primaryValue, locale: options.locale, usedFallback: false, missing: false };
  }

  if (fallback !== options.locale) {
    const fallbackValue = lookup(catalogs[fallback], key, fallback, options.count);
    if (fallbackValue !== undefined) {
      return { key, value: fallbackValue, locale: fallback, usedFallback: true, missing: false };
    }
  }

  return {
    key,
    value: missingValue(key),
    locale: options.locale,
    usedFallback: false,
    missing: true,
  };
}

export const foundationPluralCatalogs: Record<Locale, MessageCatalog> = {
  ar: {
    ...messages.ar,
    foundationItems: {
      zero: "لا توجد عينات",
      one: "عينة واحدة",
      two: "عينتان",
      few: "{count} عينات",
      many: "{count} عينة",
      other: "{count} عينة",
    },
  },
  en: {
    ...messages.en,
    foundationItems: {
      one: "{count} sample",
      other: "{count} samples",
    },
  },
};

export function resolveFoundationMessage(
  key: string,
  options: Omit<ResolveOptions, "fallbackLocale"> & { fallbackLocale?: Locale } = { locale: fallbackLocale },
): ResolveResult {
  const result = resolveMessage(key, foundationPluralCatalogs, options);
  if (options.count !== undefined) {
    return { ...result, value: result.value.replace("{count}", String(options.count)) };
  }
  return result;
}
