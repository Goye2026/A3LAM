const sensitiveKeyPattern = /(password|token|secret|api[-_]?key|authorization|cookie|email|phone|address|credential)/i;

export type LogContext = Record<string, unknown>;

export type StructuredLog = {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  timestamp: string;
  correlationId: string;
  context?: LogContext;
};

export function createCorrelationId(): string {
  return crypto.randomUUID();
}

export function redactPII(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactPII);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      sensitiveKeyPattern.test(key) ? "[REDACTED]" : redactPII(entry),
    ]),
  );
}

export function createLog(
  level: StructuredLog["level"],
  message: string,
  correlationId: string,
  context?: LogContext,
): StructuredLog {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    correlationId,
    ...(context ? { context: redactPII(context) as LogContext } : {}),
  };
}

export function writeLog(log: StructuredLog): void {
  const serialized = JSON.stringify(log);
  if (log.level === "error") console.error(serialized);
  else if (log.level === "warn") console.warn(serialized);
  else console.log(serialized);
}
