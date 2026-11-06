import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

export class StorageUnavailableError extends Error {
  constructor(message = "External storage is not configured") {
    super(message);
    this.name = "StorageUnavailableError";
  }
}

export class StorageOperationError extends Error {
  constructor(message = "External storage operation failed") {
    super(message);
    this.name = "StorageOperationError";
  }
}

export type StoredObject = { key: string; url: string };
export type StorageProviderState = "configured" | "not_configured" | "invalid_configuration";
export type StorageStatus = "ready" | "requires_configuration";

type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };

function readConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) throw new StorageUnavailableError();
  if (!/^[a-z0-9_-]+$/i.test(cloudName)) throw new StorageUnavailableError("Cloudinary configuration is invalid");
  return { cloudName, apiKey, apiSecret };
}

function configure() {
  const config = readConfig();
  cloudinary.config({ cloud_name: config.cloudName, api_key: config.apiKey, api_secret: config.apiSecret, secure: true });
  return config;
}

export function getStorageProviderState(): StorageProviderState {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) return "not_configured";
  return /^[a-z0-9_-]+$/i.test(cloudName) ? "configured" : "invalid_configuration";
}

export function getStorageStatus(): StorageStatus {
  return getStorageProviderState() === "configured" ? "ready" : "requires_configuration";
}

function publicIdFor(key: string) {
  return key.replace(/^\/+/, "").replace(/\.[a-z0-9]{2,5}$/i, "");
}

function uploadStream(bytes: Uint8Array, options: { public_id: string; resource_type: "image" }): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) return reject(new StorageOperationError());
      resolve(result);
    });
    stream.on("error", () => reject(new StorageOperationError()));
    stream.end(Buffer.from(bytes));
  });
}

export function publicUrl(key: string) {
  configure();
  return cloudinary.url(publicIdFor(key), { resource_type: "image", secure: true });
}

export async function putObject(key: string, bytes: Uint8Array, mimeType: string): Promise<StoredObject> {
  configure();
  void mimeType;
  try {
    const result = await uploadStream(bytes, { public_id: publicIdFor(key), resource_type: "image" });
    if (!result.public_id || !result.secure_url) throw new StorageOperationError();
    return { key: result.public_id, url: result.secure_url };
  } catch (error) {
    if (error instanceof StorageOperationError) throw error;
    throw new StorageOperationError();
  }
}

export async function deleteObject(key: string): Promise<void> {
  configure();
  try {
    const result = await cloudinary.uploader.destroy(publicIdFor(key), { resource_type: "image", type: "upload", invalidate: true });
    if (result.result !== "ok" && result.result !== "not found") throw new StorageOperationError();
  } catch (error) {
    if (error instanceof StorageOperationError) throw error;
    throw new StorageOperationError();
  }
}

export async function objectExists(key: string): Promise<boolean> {
  configure();
  try {
    await cloudinary.api.resource(publicIdFor(key), { resource_type: "image", type: "upload" });
    return true;
  } catch (error) {
    const status = typeof error === "object" && error !== null && "http_code" in error ? (error as { http_code?: unknown }).http_code : undefined;
    if (status === 404) return false;
    throw new StorageOperationError();
  }
}
