export interface DashboardRecentIncident {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: Date;
}

export interface DashboardRecentAlert {
  id: string;
  title: string;
  severity: string;
  status: string;
  serviceId: string;
  triggeredAt: Date;
}

export interface DashboardSummary {
  services: {
    total: number;
    byStatus: Record<string, number>;
  };
  incidents: {
    open: number;
    recent: DashboardRecentIncident[];
  };
  anomalies: {
    open: number;
  };
  alerts: {
    active: number;
    recent: DashboardRecentAlert[];
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
