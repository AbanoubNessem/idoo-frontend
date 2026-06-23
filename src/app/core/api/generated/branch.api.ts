import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../tokens/app-config.token';
import { ApiResponse, PageResponse, PageParams, BranchResponse, CreateBranchRequest, UpdateBranchRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class BranchApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly base = `${this.config.apiUrl}/v1/branches`;

  getAll(params?: PageParams & { companyId?: string; status?: string }): Observable<ApiResponse<PageResponse<BranchResponse>>> {
    return this.http.get<ApiResponse<PageResponse<BranchResponse>>>(this.base, { params: params as Record<string, string | number> });
  }

  getById(id: string): Observable<ApiResponse<BranchResponse>> {
    return this.http.get<ApiResponse<BranchResponse>>(`${this.base}/${id}`);
  }

  create(body: CreateBranchRequest): Observable<ApiResponse<BranchResponse>> {
    return this.http.post<ApiResponse<BranchResponse>>(this.base, body);
  }

  update(id: string, body: UpdateBranchRequest): Observable<ApiResponse<BranchResponse>> {
    return this.http.put<ApiResponse<BranchResponse>>(`${this.base}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  setMain(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/set-main`, null);
  }
}
