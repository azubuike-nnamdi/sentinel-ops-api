import { AnomalyStatus } from '../../common/enums';

export interface IAnomaly {
  id: string;
  serviceId: string;
  metricName: string;
  score: number;
  status: AnomalyStatus;
  description: string;
  detectedAt: Date;
  evidence: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAnomalyData {
  serviceId: string;
  metricName: string;
  score: number;
  status?: AnomalyStatus;
  description: string;
  detectedAt?: Date;
  evidence?: Record<string, unknown>;
}
