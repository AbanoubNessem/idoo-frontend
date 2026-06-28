// ============================================================
// Tenant Service – API integration layer
// ============================================================

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { APP_CONFIG } from '../../../core/tokens/app-config.token';
import { ApiResponse, PageResponse } from '../../../core/api/models';
import { TenantListItem, TenantDetail, TenantFilters, TenantPagination, CreateTenantDto, UpdateTenantDto } from '../models/tenant.models';
import { TenantMapper } from '../mappers/tenant.mapper';

export interface TenantPageResult {
  items:         TenantListItem[];
  totalElements: number;
  totalPages:    number;
}

@Injectable()
export class TenantService {
  private readonly http   = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private get base(): string { return `${this.config.apiUrl}/v1/tenants`; }

  getAll(
    filters: TenantFilters,
    pagination: Pick<TenantPagination, 'page' | 'size'>,
    sort: { field: string; direction: 'asc' | 'desc' },
  ): Observable<TenantPageResult> {
    let params = new HttpParams()
      .set('page', pagination.page.toString())
      .set('size', pagination.size.toString())
      .set('sort', `${sort.field},${sort.direction}`);

    if (filters.search) params = params.set('name', filters.search);
    if (filters.status) {
      const isActive = filters.status === 'ACTIVE';
      params = params.set('status', isActive.toString());
    }
    // Note: The backend doesn't support filtering by 'plan', so we don't send it.

    return this.http
      .get<ApiResponse<PageResponse<unknown>>>(this.base, { params })
      .pipe(
        map(res => ({
          items:         (res.data.content as unknown[]).map(d =>
            TenantMapper.toListItem(d as Parameters<typeof TenantMapper.toListItem>[0])
          ),
          totalElements: res.data.totalElements,
          totalPages:    res.data.totalPages,
        })),
      );
  }

  getById(id: string): Observable<TenantDetail> {
    return this.http
      .get<ApiResponse<unknown>>(`${this.base}/${id}`)
      .pipe(map(res => TenantMapper.toDetail(res.data as Parameters<typeof TenantMapper.toDetail>[0])));
  }

  create(dto: CreateTenantDto): Observable<TenantDetail> {
    return this.http
      .post<ApiResponse<unknown>>(this.base, dto)
      .pipe(map(res => TenantMapper.toDetail(res.data as Parameters<typeof TenantMapper.toDetail>[0])));
  }

  update(id: string, dto: UpdateTenantDto): Observable<TenantDetail> {
    return this.http
      .put<ApiResponse<unknown>>(`${this.base}/${id}`, dto)
      .pipe(map(res => TenantMapper.toDetail(res.data as Parameters<typeof TenantMapper.toDetail>[0])));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  activate(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/activate`, null);
  }

  deactivate(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/deactivate`, null);
  }
}
