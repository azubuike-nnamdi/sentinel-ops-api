export const APP_CONSTANTS = {
  APP_NAME: 'SentinelOps',
  API_VERSION: '1.0',
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const REQUEST_ID_HEADER = 'x-request-id';

export const METADATA_KEYS = {
  IS_PUBLIC: 'isPublic',
  ROLES: 'roles',
} as const;
