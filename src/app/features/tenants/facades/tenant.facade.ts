// ============================================================
// Tenant Facade – Orchestrates store + service + logging
// ============================================================

import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { LoggerService } from '../../../core/logger/logger.service';
import { TenantStore } from '../store/tenant.store';
import { TenantService } from '../services/tenant.service';
import { TenantMapper } from '../mappers/tenant.mapper';
import { TenantFilters, CreateTenantDto, UpdateTenantDto } from '../models/tenant.models';

const LOG_CTX = 'TenantFacade';

@Injectable()
export class TenantFacade {
  private readonly store      = inject(TenantStore);
  private readonly service    = inject(TenantService);
  private readonly logger     = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly searchChange$ = new Subject<string>();

  // ── Expose store slices (read-only) ─────────────────────
  readonly tenants        = this.store.tenants;
  readonly selectedTenant = this.store.selectedTenant;
  readonly statistics     = this.store.statistics;
  readonly activities     = this.store.activities;
  readonly filters        = this.store.filters;
  readonly pagination     = this.store.pagination;
  readonly loading        = this.store.loading;
  readonly loadingDetail  = this.store.loadingDetail;
  readonly error          = this.store.error;
  readonly sort           = this.store.sort;
  readonly hasError       = this.store.hasError;
  readonly isEmpty        = this.store.isEmpty;
  readonly isFirstPage    = this.store.isFirstPage;
  readonly isLastPage     = this.store.isLastPage;
  readonly totalPages     = this.store.totalPages;
  readonly currentPage    = this.store.currentPage;
  readonly pageSize       = this.store.pageSize;

  // ── Init ────────────────────────────────────────────────

  init(): void {
    this.setupSearchDebounce();
    this.loadTenants();
  }

  // ── Loaders ─────────────────────────────────────────────

  loadTenants(): void {
    this.logger.info(LOG_CTX, 'Loading tenants...', this.store.filters());
    this.store.setLoading(true);

    const { filters, pagination, sort } = this.store.state();

    this.service.getAll(filters, pagination, sort)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(res => {
          this.logger.info(LOG_CTX, 'API Success', { count: res.items.length });
          this.store.setTenants(res.items, res.totalElements, res.totalPages);
          this.store.setStatistics(TenantMapper.toStatistics(res.items));
        }),
        catchError(err => {
          const msg = err?.error?.message ?? 'Failed to load tenants.';
          this.logger.error(LOG_CTX, 'API Failed', err);
          this.store.setError(msg);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  loadTenantDetail(id: string): void {
    this.logger.info(LOG_CTX, 'Loading tenant details...', { id });
    this.store.setLoadingDetail(true);

    this.service.getById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(detail => {
          this.logger.info(LOG_CTX, 'API Success', { name: detail.name });
          this.store.setSelectedTenant(detail);
        }),
        catchError(err => {
          this.logger.error(LOG_CTX, 'API Failed', err);
          this.store.setLoadingDetail(false);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  // ── Filtering & Search ───────────────────────────────────

  setSearch(search: string): void {
    this.searchChange$.next(search);
  }

  setFilters(filters: Partial<TenantFilters>): void {
    this.logger.info(LOG_CTX, 'Filters changed...', filters);
    this.store.setFilters(filters);
    this.loadTenants();
  }

  setStatusFilter(status: TenantFilters['status']): void {
    this.logger.info(LOG_CTX, 'Filters changed...', { status });
    this.store.setFilters({ status });
    this.loadTenants();
  }

  clearFilters(): void {
    this.logger.info(LOG_CTX, 'Filters changed... (cleared)');
    this.store.setFilters({ search: '', status: '', plan: '' });
    this.loadTenants();
  }

  // ── Pagination ───────────────────────────────────────────

  goToPage(page: number): void {
    this.logger.info(LOG_CTX, 'Pagination changed...', { page });
    this.store.setPage(page);
    this.loadTenants();
  }

  setPageSize(size: number): void {
    this.logger.info(LOG_CTX, 'Pagination changed...', { size });
    this.store.setPageSize(size);
    this.loadTenants();
  }

  // ── Sort ─────────────────────────────────────────────────

  setSort(field: string, direction: 'asc' | 'desc'): void {
    this.store.setSort(field, direction);
    this.loadTenants();
  }

  // ── Selection ────────────────────────────────────────────

  selectTenant(id: string): void {
    this.logger.info(LOG_CTX, 'Selected tenant...', { id });
    this.loadTenantDetail(id);
  }

  deselectTenant(): void {
    this.store.setSelectedTenant(null);
  }

  // ── Refresh ──────────────────────────────────────────────

  refresh(): void {
    this.logger.info(LOG_CTX, 'Refreshing tenants...');
    this.loadTenants();
  }

  // ── CRUD ─────────────────────────────────────────────────

  createTenant(dto: CreateTenantDto): void {
    this.service.create(dto)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(created => {
          this.logger.info(LOG_CTX, 'API Success (create)', { id: created.id });
          this.store.addTenant(created);
        }),
        catchError(err => {
          this.logger.error(LOG_CTX, 'API Failed (create)', err);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  updateTenant(id: string, dto: UpdateTenantDto): void {
    this.service.update(id, dto)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(updated => {
          this.logger.info(LOG_CTX, 'API Success (update)', { id: updated.id });
          this.store.updateTenant(updated);
        }),
        catchError(err => {
          this.logger.error(LOG_CTX, 'API Failed (update)', err);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  deleteTenant(id: string): void {
    this.service.delete(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          this.logger.info(LOG_CTX, 'API Success (delete)', { id });
          this.store.removeTenant(id);
        }),
        catchError(err => {
          this.logger.error(LOG_CTX, 'API Failed (delete)', err);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  activateTenant(id: string): void {
    this.service.activate(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          this.logger.info(LOG_CTX, 'API Success (activate)', { id });
          this.loadTenants();
        }),
        catchError(err => {
          this.logger.error(LOG_CTX, 'API Failed (activate)', err);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  deactivateTenant(id: string): void {
    this.service.deactivate(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          this.logger.info(LOG_CTX, 'API Success (deactivate)', { id });
          this.loadTenants();
        }),
        catchError(err => {
          this.logger.error(LOG_CTX, 'API Failed (deactivate)', err);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  // ── Private ──────────────────────────────────────────────

  private setupSearchDebounce(): void {
    this.searchChange$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        tap(search => {
          this.logger.info(LOG_CTX, 'Search changed...', { search });
          this.store.setFilters({ search });
        }),
        switchMap(() => {
          this.store.setLoading(true);
          const { filters, pagination, sort } = this.store.state();
          return this.service.getAll(filters, pagination, sort).pipe(
            tap(res => {
              this.store.setTenants(res.items, res.totalElements, res.totalPages);
              this.store.setStatistics(TenantMapper.toStatistics(res.items));
            }),
            catchError(err => {
              this.logger.error(LOG_CTX, 'Search API Failed', err);
              this.store.setError('Search failed.');
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
