import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

export class StorageUnavailableError extends Error {
  constructor(message = "External storage is not configured") {
    super(message);
    this.name = "StorageUnavailableError";
  }
}

export class StorageOperationError extends Error {
  readonly publicMessage: string;
  readonly diagnostic: CloudinaryDiagnostic;

  constructor(publicMessage = "تعذر تنفيذ عملية Cloudinary.", diagnostic: CloudinaryDiagnostic = {}) {
    super(publicMessage);
    this.name = "StorageOperationError";
    this.publicMessage = publicMessage;
    this.diagnostic = diagnostic;
  }
}

export type StoredObject = { key: string; url: string };
export type StorageProviderState = "configured" | "not_configured" | "invalid_configuration";
export type StorageStatus = "ready" | "requires_configuration";

type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };
type CloudinaryError = {
  http_code?: number;
  name?: string;
  code?: string | number;
  message?: string;
  error?: { http_code?: number; name?: string; code?: string | number; message?: string };
  response?: { statusCode?: number; headers?: Record<string, unknown> };
};
export type CloudinaryDiagnostic = {
  httpStatus?: number;
  code?: string;
  name?: string;
  classification?: "authentication" | "authorization" | "bad_request" | "rate_limit" | "not_found" | "server" | "network";
};

function safeDiagnosticValue(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 80) : undefined;
}

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

export function classifyCloudinaryError(error: unknown, operation: "upload" | "delete" | "read"): { publicMessage: string; diagnostic: CloudinaryDiagnostic } {
  const candidate = (typeof error === "object" && error !== null ? error : {}) as CloudinaryError;
  const nested = candidate.error ?? {};
  const status = candidate.http_code ?? nested.http_code ?? candidate.response?.statusCode;
  const code = safeDiagnosticValue(candidate.code ?? nested.code);
  const name = safeDiagnosticValue(candidate.name ?? nested.name);
  const rawMessage = candidate.message ?? nested.message ?? "";
  const normalized = rawMessage.toLowerCase();
  const action = operation === "upload" ? "الرفع" : operation === "delete" ? "الحذف" : "القراءة";
  if (status === 401 || normalized.includes("unauthorized") || normalized.includes("invalid api key") || normalized.includes("invalid signature")) return { publicMessage: "رفض Cloudinary المصادقة؛ تحقق من بيانات اعتماد بيئة Production.", diagnostic: { httpStatus: status, code, name, classification: "authentication" } };
  if (status === 403) return { publicMessage: `رفض Cloudinary عملية ${action} بسبب صلاحيات المفتاح أو قيود بيئة المنتج.`, diagnostic: { httpStatus: status, code, name, classification: "authorization" } };
  if (status === 400) return { publicMessage: `رفض Cloudinary عملية ${action}؛ تحقق من نوع الملف وإعدادات الحساب.`, diagnostic: { httpStatus: status, code, name, classification: "bad_request" } };
  if (status === 404 && operation === "read") return { publicMessage: "الأصل غير موجود في Cloudinary.", diagnostic: { httpStatus: status, code, name, classification: "not_found" } };
  if (status === 429) return { publicMessage: "رفض Cloudinary الطلب مؤقتًا بسبب حد المعدل؛ أعد المحاولة لاحقًا.", diagnostic: { httpStatus: status, code, name, classification: "rate_limit" } };
  if (status && status >= 500) return { publicMessage: "تعذر الوصول إلى Cloudinary مؤقتًا؛ أعد المحاولة لاحقًا.", diagnostic: { httpStatus: status, code, name, classification: "server" } };
  return { publicMessage: "تعذر الاتصال بـCloudinary من بيئة Production؛ تحقق من إعدادات الشبكة والاعتماد server-side.", diagnostic: { httpStatus: status, code, name, classification: "network" } };
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
    const classified = classifyCloudinaryError(error, "upload");
    throw new StorageOperationError(classified.publicMessage, classified.diagnostic);
  }
}

export async function deleteObject(key: string): Promise<void> {
  configure();
  try {
    const result = await cloudinary.uploader.destroy(publicIdFor(key), { resource_type: "image", type: "upload", invalidate: true });
    if (result.result !== "ok" && result.result !== "not found") throw new StorageOperationError("رفض Cloudinary حذف الأصل.");
  } catch (error) {
    if (error instanceof StorageOperationError) throw error;
    const classified = classifyCloudinaryError(error, "delete");
    throw new StorageOperationError(classified.publicMessage, classified.diagnostic);
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
    const classified = classifyCloudinaryError(error, "read");
    throw new StorageOperationError(classified.publicMessage, classified.diagnostic);
  }
}
