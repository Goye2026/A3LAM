export type BiographyBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] };

function cleanLines(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseBiography(value: string): BiographyBlock[] {
  const blocks: BiographyBlock[] = [];
  const chunks = value.replace(/\r\n/g, "\n").split(/\n\s*\n/);

  for (const chunk of chunks) {
    const lines = cleanLines(chunk);
    if (lines.length === 0) continue;

    if (lines.every((line) => line.startsWith("- "))) {
      blocks.push({ type: "list", items: lines.map((line) => line.slice(2).trim()).filter(Boolean) });
      continue;
    }

    if (lines[0].startsWith("## ")) {
      blocks.push({ type: "heading", text: lines[0].slice(3).trim() });
      const remaining = lines.slice(1).join("\n").trim();
      if (remaining) blocks.push(...parseBiography(remaining));
      continue;
    }

    blocks.push({ type: "paragraph", text: lines.join(" ") });
  }

  return blocks;
}
