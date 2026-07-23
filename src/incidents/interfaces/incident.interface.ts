import { IncidentSeverity, IncidentStatus } from '../../common/enums';

export interface IIncident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  serviceIds: string[];
  anomalyIds: string[];
  rootCause: string;
  assignedTo: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIncidentData {
  title: string;
  description: string;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  serviceIds?: string[];
  anomalyIds?: string[];
  rootCause?: string;
  assignedTo?: string | null;
}

export interface UpdateIncidentData {
  title?: string;
  description?: string;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  serviceIds?: string[];
  anomalyIds?: string[];
  rootCause?: string;
  assignedTo?: string | null;
  resolvedAt?: Date | null;
}
