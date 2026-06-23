import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../tokens/app-config.token';
import { ApiResponse, PageResponse, PageParams, TenantResponse, CreateTenantRequest, UpdateTenantRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class TenantApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly base = `${this.config.apiUrl}/v1/tenants`;

  getAll(params?: PageParams & { name?: string; status?: string }): Observable<ApiResponse<PageResponse<TenantResponse>>> {
    return this.http.get<ApiResponse<PageResponse<TenantResponse>>>(this.base, { params: params as Record<string, string | number> });
  }

  getById(id: string): Observable<ApiResponse<TenantResponse>> {
    return this.http.get<ApiResponse<TenantResponse>>(`${this.base}/${id}`);
  }

  create(body: CreateTenantRequest): Observable<ApiResponse<TenantResponse>> {
    return this.http.post<ApiResponse<TenantResponse>>(this.base, body);
  }

  update(id: string, body: UpdateTenantRequest): Observable<ApiResponse<TenantResponse>> {
    return this.http.put<ApiResponse<TenantResponse>>(`${this.base}/${id}`, body);
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
