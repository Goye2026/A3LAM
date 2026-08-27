import Link from "next/link";
import type { CmsInlineNode, CmsRichTextBlock, CmsRichTextDocument } from "@/lib/cms/richText";

function inlineText(nodes: CmsInlineNode[]): string {
  return nodes.map((node) => node.type === "text" ? node.text : inlineText(node.children)).join("");
}

function renderInline(nodes: CmsInlineNode[]): React.ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${node.type}-${index}`;
    if (node.type === "text") return <span key={key}>{node.text}</span>;
    if (node.type === "bold") return <strong key={key}>{renderInline(node.children)}</strong>;
    if (node.type === "italic") return <em key={key}>{renderInline(node.children)}</em>;
    if (node.href.startsWith("/")) return <Link key={key} href={node.href}>{renderInline(node.children)}</Link>;
    return <a key={key} href={node.href} rel="noreferrer noopener" target="_blank">{renderInline(node.children)}</a>;
  });
}

function renderBlock(block: CmsRichTextBlock, index: number) {
  const key = `${block.type}-${index}`;
  if (block.type === "paragraph") return <p key={key}>{renderInline(block.children)}</p>;
  if (block.type === "heading") {
    if (block.level === 2) return <h2 key={key}>{renderInline(block.children)}</h2>;
    if (block.level === 3) return <h3 key={key}>{renderInline(block.children)}</h3>;
    return <h4 key={key}>{renderInline(block.children)}</h4>;
  }
  if (block.type === "blockquote") return <blockquote key={key}>{renderInline(block.children)}</blockquote>;
  if (block.type === "divider") return <hr key={key} />;
  if (block.type === "ordered_list") return <ol key={key}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}</ol>;
  if (block.type === "unordered_list") return <ul key={key}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}</ul>;
  if (block.type === "media") return <figure key={key} className="cms-media-placeholder">{block.altText ? <figcaption>{block.altText}</figcaption> : null}</figure>;
  return <table key={key}><tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{renderInline(cell)}</td>)}</tr>)}</tbody></table>;
}

export function CmsRichTextRenderer({ document }: { document: CmsRichTextDocument }) {
  return <div className="cms-rich-text" dir={document.direction === "auto" ? undefined : document.direction}>{document.blocks.map(renderBlock)}</div>;
}

export function cmsDocumentPlainText(document: CmsRichTextDocument) {
  return document.blocks.map((block) => {
    if (block.type === "divider") return "";
    if (block.type === "media") return block.altText;
    if (block.type === "ordered_list" || block.type === "unordered_list") return block.items.map(inlineText).join("\n");
    if (block.type === "table") return block.rows.map((row) => row.map(inlineText).join(" | ")).join("\n");
    return inlineText(block.children);
  }).filter(Boolean).join("\n\n");
}
