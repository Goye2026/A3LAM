const DEFAULT_MAX_JSON_BYTES = 262_144;

export class AdminInputError extends Error {
  constructor(message = "Invalid request body") {
    super(message);
    this.name = "AdminInputError";
  }
}

export async function readBoundedJson(request: Request, maxBytes = DEFAULT_MAX_JSON_BYTES): Promise<unknown> {
  const length = request.headers.get("content-length");
  if (length !== null) {
    const bytes = Number(length);
    if (!Number.isSafeInteger(bytes) || bytes < 0 || bytes > maxBytes) throw new AdminInputError("Request body is too large");
  }
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > maxBytes) throw new AdminInputError("Request body is too large");
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new AdminInputError("Request body is not valid JSON");
  }
}
