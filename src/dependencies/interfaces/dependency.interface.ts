import { DependencyType } from '../../common/enums';

export interface IDependency {
  id: string;
  sourceServiceId: string;
  targetServiceId: string;
  type: DependencyType;
  criticality: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
