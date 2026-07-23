import { LogLevel } from '../../common/enums';

export interface ILog {
  id: string;
  serviceId: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  traceId?: string;
  spanId?: string;
  source: string;
  host?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLogData {
  serviceId: string;
  level: LogLevel;
  message: string;
  timestamp?: Date;
  traceId?: string;
  spanId?: string;
  source?: string;
  host?: string;
  metadata?: Record<string, unknown>;
}
