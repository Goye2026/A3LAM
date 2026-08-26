import { createHash } from "node:crypto";
import type { AiDocumentOwner } from "./persistence";
import type { ValidatedAiDocument } from "./validation";

export function createPrivateDocumentKey(owner: AiDocumentOwner, input: Pick<ValidatedAiDocument, "checksumSha256" | "documentType">) {
  const ownerDigest = createHash("sha256").update(`${owner.ownerType}:${owner.ownerId}`).digest("hex");
  return `ai-private/${ownerDigest}/${input.checksumSha256}.${input.documentType}`;
}

export function isPrivateDocumentKey(value: string) {
  return /^ai-private\/[a-f0-9]{64}\/[a-f0-9]{64}\.(pdf|docx|txt)$/.test(value);
}
