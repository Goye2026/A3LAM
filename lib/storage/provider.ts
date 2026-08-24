export class StorageUnavailableError extends Error {
  constructor(message = "External storage is not configured") {
    super(message);
    this.name = "StorageUnavailableError";
  }
}

export type StoredObject = { key: string; url: string };

function config() {
  const uploadUrl = process.env.A3LAM_STORAGE_UPLOAD_URL?.trim();
  const publicBaseUrl = process.env.A3LAM_STORAGE_PUBLIC_BASE_URL?.trim();
  const token = process.env.A3LAM_STORAGE_UPLOAD_TOKEN?.trim();
  if (!uploadUrl || !publicBaseUrl || !token) throw new StorageUnavailableError();
  let parsedUpload: URL;
  let parsedPublic: URL;
  try { parsedUpload = new URL(uploadUrl); parsedPublic = new URL(publicBaseUrl); } catch { throw new StorageUnavailableError("External storage configuration is invalid"); }
  if (!["https:", "http:"].includes(parsedUpload.protocol) || !["https:", "http:"].includes(parsedPublic.protocol)) throw new StorageUnavailableError("External storage configuration is invalid");
  return { uploadUrl: parsedUpload.toString().replace(/\/$/, ""), publicBaseUrl: parsedPublic.toString().replace(/\/$/, ""), token };
}

export async function putObject(key: string, bytes: Uint8Array, mimeType: string): Promise<StoredObject> {
  const storage = config();
  const response = await fetch(`${storage.uploadUrl}/${key}`, { method: "PUT", headers: { authorization: `Bearer ${storage.token}`, "content-type": mimeType, "content-length": String(bytes.byteLength) }, body: Buffer.from(bytes) });
  if (!response.ok) throw new Error(`External storage rejected upload (${response.status})`);
  return { key, url: `${storage.publicBaseUrl}/${key}` };
}
