import { ServiceStatus } from '../../common/enums';

export interface IService {
  id: string;
  name: string;
  slug: string;
  description: string;
  owner: string;
  environment: string;
  status: ServiceStatus;
  endpoints: string[];
  tags: string[];
  metadata: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceData {
  name: string;
  slug: string;
  description?: string;
  owner: string;
  environment: string;
  status?: ServiceStatus;
  endpoints?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
  isActive?: boolean;
}
