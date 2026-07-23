export interface DashboardSummary {
  services: {
    total: number;
    byStatus: Record<string, number>;
  };
  incidents: {
    open: number;
  };
  anomalies: {
    open: number;
  };
  alerts: {
    active: number;
  };
  logs: {
    last24h: number;
  };
  metrics: {
    last24h: number;
  };
  dependencies: {
    total: number;
  };
  generatedAt: string;
}
