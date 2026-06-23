import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../tokens/app-config.token';
import { ApiResponse, PageResponse, PageParams, PermissionResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class PermissionApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly base = `${this.config.apiUrl}/v1/permissions`;

  getAll(params?: PageParams & { moduleId?: number; resource?: string; action?: string }): Observable<ApiResponse<PageResponse<PermissionResponse>>> {
    return this.http.get<ApiResponse<PageResponse<PermissionResponse>>>(this.base, { params: params as Record<string, string | number> });
  }

  getById(id: number): Observable<ApiResponse<PermissionResponse>> {
    return this.http.get<ApiResponse<PermissionResponse>>(`${this.base}/${id}`);
  }

  getByModule(moduleId: number): Observable<ApiResponse<PermissionResponse[]>> {
    return this.http.get<ApiResponse<PermissionResponse[]>>(`${this.base}/by-module/${moduleId}`);
  }
}
