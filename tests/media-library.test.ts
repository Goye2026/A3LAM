import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Phase 17.20.05 Media Library contracts", () => {
  it("provides grid/list browsing, filters, details, and truthful provider states", () => {
    const page = read("app/admin/(protected)/media/page.tsx");
    const client = read("components/a3lam/MediaLibraryClient.tsx");
    expect(page).toContain('hasEffectiveAdminPermission(principal, "media.read")');
    expect(client).toContain('view === "grid"');
    expect(client).toContain('view === "list"');
    expect(client).toContain("selectedId");
    expect(client).toContain("adminMediaDetails");
    expect(client).toContain("adminMediaNoProvider");
    expect(client).toContain("adminMediaPendingMigration");
  });

  it("keeps metadata edits and archive operations behind the existing media.manage API", () => {
    const client = read("components/a3lam/MediaLibraryClient.tsx");
    const route = read("app/api/admin/media/[id]/route.ts");
    expect(client).toContain('method: "PATCH"');
    expect(client).toContain('method: "DELETE"');
    expect(route).toContain('requirePermissionPrincipal(request, "media.manage")');
    expect(route).toContain("updateMediaAsset");
    expect(route).toContain("archiveMediaAsset");
  });

  it("supports a generic image upload through the existing provider and media repository", () => {
    const route = read("app/api/admin/media/route.ts");
    const client = read("components/a3lam/MediaLibraryClient.tsx");
    const provider = read("lib/storage/provider.ts");
    expect(route).toContain("createMediaAsset");
    expect(route).toContain("editorial/media/");
    expect(route).toContain('validateUpload(file, "portrait")');
    expect(route).toContain('getStorageProviderState() !== "configured"');
    expect(route).not.toContain('if (!personId) throw new InvalidUploadError');
    expect(client).toContain("fileInputRef.current?.click()");
    expect(client).toContain("handleFileSelection");
    expect(client).toContain("selectedFile");
    expect(client).toContain("uploadSelectedFile");
    expect(client).toContain("5 * 1024 * 1024");
    expect(client).toContain('accept="image/jpeg,image/png,image/webp"');
    expect(provider).toContain("CLOUDINARY_CLOUD_NAME");
    expect(provider).toContain("CLOUDINARY_API_KEY");
    expect(provider).toContain("CLOUDINARY_API_SECRET");
    expect(provider).toContain("upload_stream");
    expect(provider).toContain("secure_url");
  });

  it("deletes unlinked media through the provider before archiving the database record", () => {
    const route = read("app/api/admin/media/[id]/route.ts");
    expect(route).toContain("deleteObject(current.storageKey)");
    expect(route).toContain("countMediaUsages(id)");
    expect(route).toContain("Cloudinary media deletion failed");
  });

  it("does not introduce destructive deletion or a new media schema", () => {
    const repository = read("lib/media/repository.ts");
    const route = read("app/api/admin/media/[id]/route.ts");
    expect(repository).toContain("archiveMediaAsset");
    expect(repository).toContain("Detach media before archiving it");
    expect(route).not.toContain("deleteMediaAsset");
  });
});
