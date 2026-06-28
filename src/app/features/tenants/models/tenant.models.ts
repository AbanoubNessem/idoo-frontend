// ============================================================
// Tenant Domain Models – Typed, no magic strings, no `any`
// ============================================================

import { TenantStatus, SubscriptionPlan } from '../enums/tenant.enums';

// ── API Response Models ─────────────────────────────────────

export interface TenantListItem {
  id:                    string;
  code:                  string;
  name:                  string;
  domain:                string;
  logoUrl:               string | null;
  status:                TenantStatus;
  subscriptionPlan:      SubscriptionPlan;
  subscriptionExpiresAt: string | null;
  maxUsers:              number;
  createdAt:             string;
  updatedAt:             string;
}

export interface TenantDetail extends TenantListItem {
  settings:    string | null;
}

export interface TenantStatistics {
  totalTenants:     number;
  activeTenants:    number;
  trialTenants:     number;
  suspendedTenants: number;
  totalTrendData:      number[];
  activeTrendData:     number[];
  trialTrendData:      number[];
  suspendedTrendData:  number[];
}

export interface TenantActivity {
  id:        string;
  action:    string;
  details:   string;
  timestamp: string;
  actor:     string;
}

// ── Filter Models ────────────────────────────────────────────

export interface TenantFilters {
  search:   string;
  status:   TenantStatus | '';
  plan:     SubscriptionPlan | '';
}

// ── Pagination ───────────────────────────────────────────────

export interface TenantPagination {
  page:          number;
  size:          number;
  totalElements: number;
  totalPages:    number;
}

// ── Store State ──────────────────────────────────────────────

export interface TenantState {
  tenants:          TenantListItem[];
  selectedTenant:   TenantDetail | null;
  statistics:       TenantStatistics | null;
  activities:       TenantActivity[];
  filters:          TenantFilters;
  pagination:       TenantPagination;
  loading:          boolean;
  loadingDetail:    boolean;
  error:            string | null;
  sort:             { field: string; direction: 'asc' | 'desc' };
}

// ── Request Models ───────────────────────────────────────────

export interface CreateTenantDto {
  code:                  string;
  name:                  string;
  domain:                string;
  logoUrl:               string | null;
  isActive:              boolean;
  maxUsers:              number;
  subscriptionPlan:      SubscriptionPlan | string;
  subscriptionExpiresAt: string | null;
  settings:              string | null;
}

export interface UpdateTenantDto {
  code:                  string;
  name:                  string;
  domain:                string;
  logoUrl:               string | null;
  isActive:              boolean;
  maxUsers:              number;
  subscriptionPlan:      SubscriptionPlan | string;
  subscriptionExpiresAt: string | null;
  settings:              string | null;
}

// ── Stat Card Display Model ──────────────────────────────────

export interface TenantStatCard {
  id:          string;
  title:       string;
  count:       number;
  description: string;
  icon:        string;
  colorVar:    string;   // CSS variable name e.g. '--color-primary'
  trendData:   number[];
  trendColor:  string;   // CSS variable name for trend line
}
