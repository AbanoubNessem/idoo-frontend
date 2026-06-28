// ============================================================
// Tenant Enums – Centralized, no magic strings
// ============================================================

export enum TenantStatus {
  ACTIVE     = 'ACTIVE',
  INACTIVE   = 'INACTIVE',
  TRIAL      = 'TRIAL',
  SUSPENDED  = 'SUSPENDED',
}

export enum SubscriptionPlan {
  ENTERPRISE   = 'ENTERPRISE',
  PROFESSIONAL = 'PROFESSIONAL',
  STANDARD     = 'STANDARD',
  TRIAL        = 'TRIAL',
}

export enum TenantDetailTab {
  OVERVIEW    = 'overview',
  STATISTICS  = 'statistics',
  SETTINGS    = 'settings',
  ACTIVITY    = 'activity',
}

export enum TenantSortField {
  NAME       = 'name',
  CODE       = 'code',
  CREATED_AT = 'createdAt',
  STATUS     = 'status',
  PLAN       = 'subscriptionPlan',
}
