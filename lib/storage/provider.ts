import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

export class StorageUnavailableError extends Error {
  constructor(message = "External storage is not configured") {
    super(message);
    this.name = "StorageUnavailableError";
  }
}

export class StorageOperationError extends Error {
  readonly publicMessage: string;

  constructor(publicMessage = "تعذر تنفيذ عملية Cloudinary.") {
    super(publicMessage);
    this.name = "StorageOperationError";
    this.publicMessage = publicMessage;
  }
}

export type StoredObject = { key: string; url: string };
export type StorageProviderState = "configured" | "not_configured" | "invalid_configuration";
export type StorageStatus = "ready" | "requires_configuration";

type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };
type CloudinaryError = { http_code?: number; message?: string; error?: { http_code?: number; message?: string } };

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

export function getStorageConfigurationIssue(): string | null {
  const missing = (["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"] as const).filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) return `متغير Cloudinary الناقص: ${missing.join(", ")}.`;
  if (getStorageProviderState() === "invalid_configuration") return "قيمة CLOUDINARY_CLOUD_NAME غير صالحة.";
  return null;
}

export function getStorageStatus(): StorageStatus {
  return getStorageProviderState() === "configured" ? "ready" : "requires_configuration";
}

function publicIdFor(key: string) {
  return key.replace(/^\/+/, "").replace(/\.[a-z0-9]{2,5}$/i, "");
}

function cloudinaryErrorMessage(error: unknown, operation: "upload" | "delete" | "read") {
  const candidate = (typeof error === "object" && error !== null ? error : {}) as CloudinaryError;
  const nested = candidate.error ?? {};
  const status = candidate.http_code ?? nested.http_code;
  const rawMessage = candidate.message ?? nested.message ?? "";
  const normalized = rawMessage.toLowerCase();
  if (status === 401 || status === 403 || normalized.includes("unauthorized") || normalized.includes("invalid api key") || normalized.includes("invalid signature")) {
    return "رفض Cloudinary المصادقة؛ تحقق من CLOUDINARY_API_KEY وCLOUDINARY_API_SECRET في Vercel Production.";
  }
  if (status === 400) return `رفض Cloudinary عملية ${operation === "upload" ? "الرفع" : operation === "delete" ? "الحذف" : "القراءة"}؛ تحقق من نوع الملف وإعدادات الحساب.`;
  if (status === 404 && operation === "read") return "الأصل غير موجود في Cloudinary.";
  if (status && status >= 500) return "تعذر الوصول إلى Cloudinary مؤقتًا؛ أعد المحاولة لاحقًا.";
  return "تعذر الاتصال بـCloudinary من بيئة Production؛ تحقق من إعدادات الشبكة والاعتماد server-side.";
}

function uploadStream(bytes: Uint8Array, options: { public_id: string; resource_type: "image" }): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) return reject(error ?? new StorageOperationError());
      resolve(result);
    });
    stream.on("error", (error) => reject(error));
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
    if (!result.public_id || !result.secure_url) throw new StorageOperationError("أعاد Cloudinary استجابة غير مكتملة لعملية الرفع.");
    return { key: result.public_id, url: result.secure_url };
  } catch (error) {
    if (error instanceof StorageOperationError) throw error;
    throw new StorageOperationError(cloudinaryErrorMessage(error, "upload"));
  }
}

export async function deleteObject(key: string): Promise<void> {
  configure();
  try {
    const result = await cloudinary.uploader.destroy(publicIdFor(key), { resource_type: "image", type: "upload", invalidate: true });
    if (result.result !== "ok" && result.result !== "not found") throw new StorageOperationError("رفض Cloudinary حذف الأصل.");
  } catch (error) {
    if (error instanceof StorageOperationError) throw error;
    throw new StorageOperationError(cloudinaryErrorMessage(error, "delete"));
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
    throw new StorageOperationError(cloudinaryErrorMessage(error, "read"));
  }
}
