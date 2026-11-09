import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { MediaInputError, parseMediaMetadataInput } from "@/lib/media/validation";
import { classifyCloudinaryError } from "@/lib/storage/provider";

const root = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Phase 17.20.15 media upload repair", () => {
  it("keeps public media source and license requirements explicit", () => {
    const client = read("components/a3lam/MediaLibraryClient.tsx");
    expect(client).toContain('required={visibility === "public"}');
    expect(client).toContain("الصور العامة تتطلب مصدر الصورة والترخيص أو الحقوق.");
    expect(() => parseMediaMetadataInput({ altText: "صورة", sourceUrl: "", attribution: "", license: "", visibility: "public" })).toThrow(MediaInputError);
    expect(parseMediaMetadataInput({ altText: "صورة", sourceUrl: "https://example.com/source", attribution: "Example", license: "CC BY", visibility: "public" })).toMatchObject({ visibility: "public" });
  });

  it("classifies authentication and authorization failures separately", () => {
    expect(classifyCloudinaryError({ http_code: 401, error: { message: "Invalid signature" } }, "upload")).toMatchObject({ diagnostic: { httpStatus: 401, classification: "authentication" } });
    expect(classifyCloudinaryError({ http_code: 403, error: { message: "Upload not allowed" } }, "upload")).toMatchObject({ diagnostic: { httpStatus: 403, classification: "authorization" } });
  });

  it("classifies rate limits and server failures without exposing raw errors", () => {
    expect(classifyCloudinaryError({ http_code: 429, message: "Too many requests" }, "upload")).toMatchObject({ diagnostic: { httpStatus: 429, classification: "rate_limit" } });
    expect(classifyCloudinaryError({ http_code: 503, message: "temporary failure" }, "upload")).toMatchObject({ diagnostic: { httpStatus: 503, classification: "server" } });
    const result = classifyCloudinaryError({ http_code: 401, message: "api_secret=should-not-return" }, "upload");
    expect(result.publicMessage).not.toContain("api_secret");
  });
});
