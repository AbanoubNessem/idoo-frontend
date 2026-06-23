/**
 * Centralised permission code constants.
 * Format: MODULE:resource:action — mirrors backend permission.code exactly.
 * Avoids hardcoded permission strings scattered across feature modules.
 */
export const PERMISSIONS = {
  USERS: {
    VIEW: 'AUTH:users:read',
    CREATE: 'AUTH:users:create',
    UPDATE: 'AUTH:users:update',
    DELETE: 'AUTH:users:delete',
    ACTIVATE: 'AUTH:users:activate',
    DEACTIVATE: 'AUTH:users:deactivate',
    UNLOCK: 'AUTH:users:unlock',
    RESET_PASSWORD: 'AUTH:users:reset-password',
    MANAGE_ROLES: 'AUTH:users:manage-roles',
    MANAGE_PERMISSIONS: 'AUTH:users:manage-permissions',
    MANAGE_BRANCHES: 'AUTH:users:manage-branches',
  },
  ROLES: {
    VIEW: 'AUTH:roles:read',
    CREATE: 'AUTH:roles:create',
    UPDATE: 'AUTH:roles:update',
    DELETE: 'AUTH:roles:delete',
    MANAGE_PERMISSIONS: 'AUTH:roles:manage-permissions',
  },
  COMPANIES: {
    VIEW: 'CORE:companies:read',
    CREATE: 'CORE:companies:create',
    UPDATE: 'CORE:companies:update',
    DELETE: 'CORE:companies:delete',
  },
  BRANCHES: {
    VIEW: 'CORE:branches:read',
    CREATE: 'CORE:branches:create',
    UPDATE: 'CORE:branches:update',
    DELETE: 'CORE:branches:delete',
  },
  DEPARTMENTS: {
    VIEW: 'CORE:departments:read',
    CREATE: 'CORE:departments:create',
    UPDATE: 'CORE:departments:update',
    DELETE: 'CORE:departments:delete',
  },
  TENANTS: {
    VIEW: 'CORE:tenants:read',
    CREATE: 'CORE:tenants:create',
    UPDATE: 'CORE:tenants:update',
    DELETE: 'CORE:tenants:delete',
  },
} as const;
