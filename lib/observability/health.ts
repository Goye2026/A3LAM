export type HealthStatus = "ok" | "degraded";

export type HealthResponse = {
  status: HealthStatus;
  service: "a3lam";
  timestamp: string;
};

export function getHealthResponse(): HealthResponse {
  return {
    status: "ok",
    service: "a3lam",
    timestamp: new Date().toISOString(),
  };
}
