import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { METADATA_KEYS } from '../constants';
import { UserRole } from '../enums';

export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(METADATA_KEYS.IS_PUBLIC, true);

export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(METADATA_KEYS.ROLES, roles);

/**
 * Composes Swagger bearer auth metadata. Pair with JwtAuthGuard / RolesGuard
 * from the Auth module once those are registered.
 */
export const ApiAuth = (): MethodDecorator & ClassDecorator =>
  applyDecorators(
    ApiBearerAuth('JWT'),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );

export { UseGuards };
export { CurrentUser } from './current-user.decorator';
