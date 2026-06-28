// ============================================================
// Tenant Store – Signal-based reactive state management
// ============================================================

import { Injectable, computed, signal } from '@angular/core';
import {
  TenantListItem, TenantDetail, TenantFilters,
  TenantPagination, TenantState, TenantStatistics,
  TenantActivity,
} from '../models/tenant.models';
import { TenantStatus, SubscriptionPlan } from '../enums/tenant.enums';

const INITIAL_FILTERS: TenantFilters = {
  search:   '',
  status:   '',
  plan:     '',
};

const INITIAL_PAGINATION: TenantPagination = {
  page:          0,
  size:          10,
  totalElements: 0,
  totalPages:    0,
};

const INITIAL_STATE: TenantState = {
  tenants:       [],
  selectedTenant: null,
  statistics:    null,
  activities:    [],
  filters:       INITIAL_FILTERS,
  pagination:    INITIAL_PAGINATION,
  loading:       false,
  loadingDetail: false,
  error:         null,
  sort:          { field: 'createdAt', direction: 'desc' },
};

@Injectable()
export class TenantStore {
  // ── Private mutable state ────────────────────────────────
  private readonly _state = signal<TenantState>(INITIAL_STATE);

  // ── Public read-only slices ──────────────────────────────
  readonly state           = this._state.asReadonly();
  readonly tenants         = computed(() => this._state().tenants);
  readonly selectedTenant  = computed(() => this._state().selectedTenant);
  readonly statistics      = computed(() => this._state().statistics);
  readonly activities      = computed(() => this._state().activities);
  readonly filters         = computed(() => this._state().filters);
  readonly pagination      = computed(() => this._state().pagination);
  readonly loading         = computed(() => this._state().loading);
  readonly loadingDetail   = computed(() => this._state().loadingDetail);
  readonly error           = computed(() => this._state().error);
  readonly sort            = computed(() => this._state().sort);

  // ── Computed derived state ───────────────────────────────
  readonly hasError        = computed(() => this._state().error !== null);
  readonly isEmpty         = computed(() => !this._state().loading && this._state().tenants.length === 0);
  readonly isFirstPage     = computed(() => this._state().pagination.page === 0);
  readonly isLastPage      = computed(() => {
    const p = this._state().pagination;
    return p.page >= p.totalPages - 1;
  });
  readonly totalPages      = computed(() => this._state().pagination.totalPages);
  readonly currentPage     = computed(() => this._state().pagination.page);
  readonly pageSize        = computed(() => this._state().pagination.size);

  // ── Mutators ─────────────────────────────────────────────

  setLoading(loading: boolean): void {
    this._state.update(s => ({ ...s, loading, error: loading ? null : s.error }));
  }

  setLoadingDetail(loadingDetail: boolean): void {
    this._state.update(s => ({ ...s, loadingDetail }));
  }

  setError(error: string): void {
    this._state.update(s => ({ ...s, error, loading: false, loadingDetail: false }));
  }

  clearError(): void {
    this._state.update(s => ({ ...s, error: null }));
  }

  setTenants(tenants: TenantListItem[], totalElements: number, totalPages: number): void {
    this._state.update(s => ({
      ...s,
      tenants,
      loading: false,
      pagination: { ...s.pagination, totalElements, totalPages },
    }));
  }

  setSelectedTenant(tenant: TenantDetail | null): void {
    this._state.update(s => ({ ...s, selectedTenant: tenant, loadingDetail: false }));
  }

  setStatistics(statistics: TenantStatistics): void {
    this._state.update(s => ({ ...s, statistics }));
  }

  setActivities(activities: TenantActivity[]): void {
    this._state.update(s => ({ ...s, activities }));
  }

  setFilters(filters: Partial<TenantFilters>): void {
    this._state.update(s => ({
      ...s,
      filters: { ...s.filters, ...filters },
      pagination: { ...s.pagination, page: 0 },
    }));
  }

  setPage(page: number): void {
    this._state.update(s => ({ ...s, pagination: { ...s.pagination, page } }));
  }

  setPageSize(size: number): void {
    this._state.update(s => ({ ...s, pagination: { ...s.pagination, size, page: 0 } }));
  }

  setSort(field: string, direction: 'asc' | 'desc'): void {
    this._state.update(s => ({ ...s, sort: { field, direction } }));
  }

  addTenant(tenant: TenantDetail): void {
    this._state.update(s => ({
      ...s,
      tenants: [tenant, ...s.tenants],
      pagination: { ...s.pagination, totalElements: s.pagination.totalElements + 1 },
    }));
  }

  updateTenant(updated: TenantDetail): void {
    this._state.update(s => ({
      ...s,
      tenants: s.tenants.map(t => t.id === updated.id ? updated : t),
      selectedTenant: s.selectedTenant?.id === updated.id ? updated : s.selectedTenant,
    }));
  }

  removeTenant(id: string): void {
    this._state.update(s => ({
      ...s,
      tenants: s.tenants.filter(t => t.id !== id),
      selectedTenant: s.selectedTenant?.id === id ? null : s.selectedTenant,
      pagination: { ...s.pagination, totalElements: Math.max(0, s.pagination.totalElements - 1) },
    }));
  }

  reset(): void {
    this._state.set(INITIAL_STATE);
  }
}
