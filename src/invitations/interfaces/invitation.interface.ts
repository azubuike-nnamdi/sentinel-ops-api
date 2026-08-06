import { InvitationStatus, UserRole } from '../../common/enums';

export interface IInvitation {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: InvitationStatus;
  expiresAt: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
  invitedBy: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvitationData {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status?: InvitationStatus;
  tokenHash: string;
  expiresAt: Date;
  invitedBy: string;
  userId: string;
}
