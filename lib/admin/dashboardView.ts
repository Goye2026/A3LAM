export type AdminMetricValue = number | null;

export function presentAdminMetric(value: AdminMetricValue | undefined): number | "—" {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : "—";
}

export type DashboardMetricInput = {
  label: string;
  value: AdminMetricValue;
  featured?: boolean;
};

export type DashboardMetricView = {
  label: string;
  displayValue: number | "—";
  featured: boolean;
};

export function toDashboardMetricView(metric: DashboardMetricInput): DashboardMetricView {
  return {
    label: metric.label,
    displayValue: presentAdminMetric(metric.value),
    featured: metric.featured === true,
  };
}
