import { getSafePublicUrl } from "@/lib/media/public";
import { isSafeCmsInternalPath } from "./slug";

export type CmsRichTextDirection = "rtl" | "ltr" | "auto";
export type CmsInlineNode =
  | { type: "text"; text: string }
  | { type: "bold"; children: CmsInlineNode[] }
  | { type: "italic"; children: CmsInlineNode[] }
  | { type: "link"; href: string; children: CmsInlineNode[] };

export type CmsRichTextBlock =
  | { type: "paragraph"; children: CmsInlineNode[] }
  | { type: "heading"; level: 2 | 3 | 4; children: CmsInlineNode[] }
  | { type: "ordered_list"; items: CmsInlineNode[][] }
  | { type: "unordered_list"; items: CmsInlineNode[][] }
  | { type: "blockquote"; children: CmsInlineNode[] }
  | { type: "divider" }
  | { type: "media"; mediaId: string; altText: string }
  | { type: "table"; rows: CmsInlineNode[][][] };

export type CmsRichTextDocument = {
  version: 1;
  direction: CmsRichTextDirection;
  blocks: CmsRichTextBlock[];
};

export const EMPTY_CMS_RICH_TEXT: CmsRichTextDocument = Object.freeze({ version: 1, direction: "auto", blocks: [] });

const MAX_BLOCKS = 200;
const MAX_INLINE_DEPTH = 8;
const MAX_TEXT_LENGTH = 10_000;
const MAX_ROWS = 20;
const MAX_COLUMNS = 20;

export class CmsRichTextInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CmsRichTextInputError";
  }
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CmsRichTextInputError(`${path} must be an object`);
  return value as Record<string, unknown>;
}

function boundedText(value: unknown, path: string, max = MAX_TEXT_LENGTH) {
  if (typeof value !== "string") throw new CmsRichTextInputError(`${path} must be text`);
  if (value.length > max) throw new CmsRichTextInputError(`${path} is too long`);
  if (/[<>]/.test(value)) throw new CmsRichTextInputError(`${path} must not contain raw HTML`);
  return value;
}

function safeHref(value: unknown, path: string) {
  const href = boundedText(value, path, 2_000).trim();
  if (!href) throw new CmsRichTextInputError(`${path} is required`);
  if (isSafeCmsInternalPath(href)) return href;
  if (!getSafePublicUrl(href)) throw new CmsRichTextInputError(`${path} must be a safe internal or HTTPS URL`);
  return href;
}

function inlineNodes(value: unknown, path: string, depth = 0): CmsInlineNode[] {
  if (!Array.isArray(value)) throw new CmsRichTextInputError(`${path} must be an array`);
  if (depth > MAX_INLINE_DEPTH) throw new CmsRichTextInputError(`${path} is nested too deeply`);
  return value.map((item, index) => {
    const nodePath = `${path}.${index}`;
    const itemRecord = record(item, nodePath);
    const type = itemRecord.type;
    if (type === "text") return { type, text: boundedText(itemRecord.text, `${nodePath}.text`) };
    if (type === "bold" || type === "italic") return { type, children: inlineNodes(itemRecord.children, `${nodePath}.children`, depth + 1) };
    if (type === "link") return { type, href: safeHref(itemRecord.href, `${nodePath}.href`), children: inlineNodes(itemRecord.children, `${nodePath}.children`, depth + 1) };
    throw new CmsRichTextInputError(`${nodePath}.type is unsupported`);
  });
}

function inlineItems(value: unknown, path: string, maxItems = MAX_ROWS) {
  if (!Array.isArray(value) || value.length > maxItems) throw new CmsRichTextInputError(`${path} has an invalid size`);
  return value.map((item, index) => inlineNodes(item, `${path}.${index}`));
}

export function parseCmsRichTextDocument(value: unknown): CmsRichTextDocument {
  const source = record(value, "content");
  if (source.version !== 1) throw new CmsRichTextInputError("content.version is unsupported");
  const direction = source.direction;
  if (direction !== "rtl" && direction !== "ltr" && direction !== "auto") throw new CmsRichTextInputError("content.direction is invalid");
  if (!Array.isArray(source.blocks) || source.blocks.length > MAX_BLOCKS) throw new CmsRichTextInputError("content.blocks has an invalid size");

  const blocks = source.blocks.map((item, index): CmsRichTextBlock => {
    const path = `content.blocks.${index}`;
    const block = record(item, path);
    const type = block.type;
    if (type === "paragraph" || type === "blockquote") return { type, children: inlineNodes(block.children, `${path}.children`) };
    if (type === "heading") {
      if (block.level !== 2 && block.level !== 3 && block.level !== 4) throw new CmsRichTextInputError(`${path}.level is invalid`);
      return { type, level: block.level, children: inlineNodes(block.children, `${path}.children`) };
    }
    if (type === "ordered_list" || type === "unordered_list") return { type, items: inlineItems(block.items, `${path}.items`) };
    if (type === "divider") return { type };
    if (type === "media") {
      const mediaId = boundedText(block.mediaId, `${path}.mediaId`, 160).trim();
      if (!mediaId) throw new CmsRichTextInputError(`${path}.mediaId is required`);
      return { type, mediaId, altText: boundedText(block.altText, `${path}.altText`, 500).trim() };
    }
    if (type === "table") {
      if (!Array.isArray(block.rows) || block.rows.length > MAX_ROWS) throw new CmsRichTextInputError(`${path}.rows has an invalid size`);
      const rows = block.rows.map((row, rowIndex) => {
        if (!Array.isArray(row) || row.length > MAX_COLUMNS) throw new CmsRichTextInputError(`${path}.rows.${rowIndex} has an invalid size`);
        return row.map((cell, columnIndex) => inlineNodes(cell, `${path}.rows.${rowIndex}.${columnIndex}`));
      });
      return { type, rows };
    }
    throw new CmsRichTextInputError(`${path}.type is unsupported`);
  });

  return { version: 1, direction, blocks };
}

export function isCmsRichTextDocument(value: unknown): value is CmsRichTextDocument {
  try {
    parseCmsRichTextDocument(value);
    return true;
  } catch {
    return false;
  }
}
