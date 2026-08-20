export type ErrorCategory =
  | "validation"
  | "configuration"
  | "authorization"
  | "not_found"
  | "conflict"
  | "rate_limit"
  | "infrastructure"
  | "internal";

export type FoundationErrorCode =
  | "INVALID_INPUT"
  | "INVALID_CONFIGURATION"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "DEPENDENCY_UNAVAILABLE"
  | "INTERNAL_ERROR";

export type SafeError = {
  category: ErrorCategory;
  code: FoundationErrorCode;
  publicMessage: string;
  status: number;
};

export const safeErrors: Record<FoundationErrorCode, SafeError> = {
  INVALID_INPUT: {
    category: "validation",
    code: "INVALID_INPUT",
    publicMessage: "The submitted value is invalid.",
    status: 400,
  },
  INVALID_CONFIGURATION: {
    category: "configuration",
    code: "INVALID_CONFIGURATION",
    publicMessage: "The service configuration is unavailable.",
    status: 500,
  },
  UNAUTHORIZED: {
    category: "authorization",
    code: "UNAUTHORIZED",
    publicMessage: "This action is not available.",
    status: 401,
  },
  NOT_FOUND: {
    category: "not_found",
    code: "NOT_FOUND",
    publicMessage: "The requested resource was not found.",
    status: 404,
  },
  CONFLICT: {
    category: "conflict",
    code: "CONFLICT",
    publicMessage: "The request conflicts with the current state.",
    status: 409,
  },
  RATE_LIMITED: {
    category: "rate_limit",
    code: "RATE_LIMITED",
    publicMessage: "Too many requests. Try again later.",
    status: 429,
  },
  DEPENDENCY_UNAVAILABLE: {
    category: "infrastructure",
    code: "DEPENDENCY_UNAVAILABLE",
    publicMessage: "A required service is temporarily unavailable.",
    status: 503,
  },
  INTERNAL_ERROR: {
    category: "internal",
    code: "INTERNAL_ERROR",
    publicMessage: "An unexpected error occurred.",
    status: 500,
  },
};
