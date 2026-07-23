import { Request } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  timestamp: string;
  requestId: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
  requestId?: string;
}
