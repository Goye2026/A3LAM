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

type StorageConfig = { uploadUrl: string; publicBaseUrl: string; token: string };

function config(): StorageConfig {
  const uploadUrl = process.env.A3LAM_STORAGE_UPLOAD_URL?.trim();
  const publicBaseUrl = process.env.A3LAM_STORAGE_PUBLIC_BASE_URL?.trim();
  const token = process.env.A3LAM_STORAGE_UPLOAD_TOKEN?.trim();
  if (!uploadUrl || !publicBaseUrl || !token) throw new StorageUnavailableError();
  let parsedUpload: URL;
  let parsedPublic: URL;
  try {
    parsedUpload = new URL(uploadUrl);
    parsedPublic = new URL(publicBaseUrl);
  } catch {
    throw new StorageUnavailableError("External storage configuration is invalid");
  }
  if (!["https:", "http:"].includes(parsedUpload.protocol) || !["https:", "http:"].includes(parsedPublic.protocol)) throw new StorageUnavailableError("External storage configuration is invalid");
  return { uploadUrl: parsedUpload.toString().replace(/\/$/, ""), publicBaseUrl: parsedPublic.toString().replace(/\/$/, ""), token };
}

export function getStorageProviderState(): StorageProviderState {
  const uploadUrl = process.env.A3LAM_STORAGE_UPLOAD_URL?.trim();
  const publicBaseUrl = process.env.A3LAM_STORAGE_PUBLIC_BASE_URL?.trim();
  const token = process.env.A3LAM_STORAGE_UPLOAD_TOKEN?.trim();
  if (!uploadUrl || !publicBaseUrl || !token) return "not_configured";
  try {
    const upload = new URL(uploadUrl);
    const publicBase = new URL(publicBaseUrl);
    if (!["https:", "http:"].includes(upload.protocol) || !["https:", "http:"].includes(publicBase.protocol)) return "invalid_configuration";
    return "configured";
  } catch {
    return "invalid_configuration";
  }
}

export function getStorageStatus(): StorageStatus {
  return getStorageProviderState() === "configured" ? "ready" : "requires_configuration";
}

function authorization(configured: StorageConfig) { return { authorization: `Bearer ${configured.token}` }; }

export function publicUrl(key: string) {
  return `${config().publicBaseUrl}/${key.replace(/^\/+/, "")}`;
}

export async function putObject(key: string, bytes: Uint8Array, mimeType: string): Promise<StoredObject> {
  const storage = config();
  try {
    const response = await fetch(`${storage.uploadUrl}/${key}`, { method: "PUT", headers: { ...authorization(storage), "content-type": mimeType, "content-length": String(bytes.byteLength) }, body: Buffer.from(bytes) });
    if (!response.ok) throw new StorageOperationError();
    return { key, url: `${storage.publicBaseUrl}/${key}` };
  } catch (error) {
    if (error instanceof StorageOperationError) throw error;
    throw new StorageOperationError();
  }
}

export async function deleteObject(key: string): Promise<void> {
  const storage = config();
  try {
    const response = await fetch(`${storage.uploadUrl}/${key}`, { method: "DELETE", headers: authorization(storage) });
    if (!response.ok && response.status !== 404) throw new StorageOperationError();
  } catch (error) {
    if (error instanceof StorageOperationError) throw error;
    throw new StorageOperationError();
  }
}

export async function objectExists(key: string): Promise<boolean> {
  const storage = config();
  try {
    const response = await fetch(`${storage.uploadUrl}/${key}`, { method: "HEAD", headers: authorization(storage) });
    if (response.status === 404) return false;
    if (!response.ok) throw new StorageOperationError();
    return true;
  } catch (error) {
    if (error instanceof StorageOperationError) throw error;
    throw new StorageOperationError();
  }
}
