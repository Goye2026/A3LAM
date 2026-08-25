import { ADMIN_ROLE_CODES, type AdminRoleCode } from "@/lib/admin/types";

function invalid(message: string): never {
  const error = new Error(message);
  error.name = "AdminInputError";
  throw error;
}

function requiredText(value: unknown, field: string, maxLength: number) {
  if (typeof value !== "string") invalid(`Invalid ${field}`);
  const text = value.trim();
  if (!text || text.length > maxLength) invalid(`Invalid ${field}`);
  return text;
}

export function parseAdminIdentityCreateBody(body: unknown) {
  if (!body || typeof body !== "object") invalid("Invalid body");
  const input = body as Record<string, unknown>;
  const email = requiredText(input.email, "email", 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid("Invalid email");
  const displayName = requiredText(input.displayName, "displayName", 160);
  const role = input.role;
  if (typeof role !== "string" || !ADMIN_ROLE_CODES.includes(role as AdminRoleCode)) invalid("Invalid role");
  return { email, displayName, role: role as AdminRoleCode };
}

export function parseAdminIdentityUpdateBody(body: unknown) {
  if (!body || typeof body !== "object") invalid("Invalid body");
  const input = body as Record<string, unknown>;
  const result: { role?: AdminRoleCode; status?: "active" | "disabled"; email?: string; displayName?: string } = {};
  if (input.role !== undefined) {
    if (typeof input.role !== "string" || !ADMIN_ROLE_CODES.includes(input.role as AdminRoleCode)) invalid("Invalid role");
    result.role = input.role as AdminRoleCode;
  }
  if (input.status !== undefined) {
    if (input.status !== "active" && input.status !== "disabled") invalid("Invalid status");
    result.status = input.status;
  }
  if (input.email !== undefined) {
    const email = requiredText(input.email, "email", 320).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid("Invalid email");
    result.email = email;
  }
  if (input.displayName !== undefined) result.displayName = requiredText(input.displayName, "displayName", 160);
  if (!result.role && !result.status && !result.email && !result.displayName) invalid("No editable fields supplied");
  return result;
}

export function parseId(value: string) {
  const id = value.trim();
  if (!id || id.length > 128) invalid("Invalid id");
  return id;
}
