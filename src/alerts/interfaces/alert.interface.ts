import { AlertSeverity, AlertStatus } from '../../common/enums';

export interface IAlert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  serviceId: string;
  incidentId: string | null;
  channel: string;
  triggeredAt: Date;
  acknowledgedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAlertData {
  title: string;
  message: string;
  severity?: AlertSeverity;
  status?: AlertStatus;
  serviceId: string;
  incidentId?: string | null;
  channel?: string;
  triggeredAt?: Date;
}
