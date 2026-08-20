export type HealthStatus = "ok" | "degraded";

export type HealthResponse = {
  status: HealthStatus;
  service: "a3lam-phase02-foundation";
  timestamp: string;
};

export function getHealthResponse(): HealthResponse {
  return {
    status: "ok",
    service: "a3lam-phase02-foundation",
    timestamp: new Date().toISOString(),
  };
}
