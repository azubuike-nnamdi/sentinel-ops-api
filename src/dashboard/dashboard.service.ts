import { Injectable } from '@nestjs/common';
import { AlertsService } from '../alerts/alerts.service';
import { AnomaliesService } from '../anomalies/anomalies.service';
import { DependenciesService } from '../dependencies/dependencies.service';
import { IncidentsService } from '../incidents/incidents.service';
import { LogsService } from '../logs/logs.service';
import { MetricsService } from '../metrics/metrics.service';
import { ServicesService } from '../services/services.service';
import { DashboardSummary } from './interfaces/dashboard.interface';

@Injectable()
export class DashboardService {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly incidentsService: IncidentsService,
    private readonly anomaliesService: AnomaliesService,
    private readonly alertsService: AlertsService,
    private readonly logsService: LogsService,
    private readonly metricsService: MetricsService,
    private readonly dependenciesService: DependenciesService,
  ) {}

  async getSummary(): Promise<DashboardSummary> {
    const [
      totalServices,
      byStatus,
      openIncidents,
      recentIncidents,
      openAnomalies,
      activeAlerts,
      recentAlerts,
      logsLast24h,
      metricsLast24h,
      totalDependencies,
    ] = await Promise.all([
      this.servicesService.countAll(),
      this.servicesService.countByStatus(),
      this.incidentsService.countOpen(),
      this.incidentsService.findAll({ page: 1, limit: 5, sort: '-createdAt' }),
      this.anomaliesService.countOpen(),
      this.alertsService.countActive(),
      this.alertsService.findRecent(5),
      this.logsService.countSince(24),
      this.metricsService.countSince(24),
      this.dependenciesService.countAll(),
    ]);

    return {
      services: { total: totalServices, byStatus },
      incidents: {
        open: openIncidents,
        recent: recentIncidents.items.map((item) => ({
          id: item.id,
          title: item.title,
          severity: item.severity,
          status: item.status,
          createdAt: item.createdAt,
        })),
      },
      anomalies: { open: openAnomalies },
      alerts: {
        active: activeAlerts,
        recent: recentAlerts.map((item) => ({
          id: item.id,
          title: item.title,
          severity: item.severity,
          status: item.status,
          serviceId: item.serviceId,
          triggeredAt: item.triggeredAt,
        })),
      },
      logs: { last24h: logsLast24h },
      metrics: { last24h: metricsLast24h },
      dependencies: { total: totalDependencies },
      generatedAt: new Date().toISOString(),
    };
  }
}
