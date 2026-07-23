import { MetricType } from '../schemas/metric.schema';

export interface IMetric {
  id: string;
  serviceId: string;
  name: string;
  type: MetricType;
  value: number;
  unit: string;
  labels: Record<string, string>;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMetricData {
  serviceId: string;
  name: string;
  type?: MetricType;
  value: number;
  unit?: string;
  labels?: Record<string, string>;
  timestamp?: Date;
}
