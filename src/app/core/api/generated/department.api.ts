import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../tokens/app-config.token';
import { ApiResponse, PageResponse, PageParams, DepartmentResponse, DepartmentTreeResponse, CreateDepartmentRequest, UpdateDepartmentRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class DepartmentApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly base = `${this.config.apiUrl}/v1/departments`;

  getAll(params?: PageParams & { companyId?: string; branchId?: string }): Observable<ApiResponse<PageResponse<DepartmentResponse>>> {
    return this.http.get<ApiResponse<PageResponse<DepartmentResponse>>>(this.base, { params: params as Record<string, string | number> });
  }

  getById(id: string): Observable<ApiResponse<DepartmentResponse>> {
    return this.http.get<ApiResponse<DepartmentResponse>>(`${this.base}/${id}`);
  }

  getChildren(id: string): Observable<ApiResponse<DepartmentResponse[]>> {
    return this.http.get<ApiResponse<DepartmentResponse[]>>(`${this.base}/${id}/children`);
  }

  getTree(companyId: string): Observable<ApiResponse<DepartmentTreeResponse[]>> {
    return this.http.get<ApiResponse<DepartmentTreeResponse[]>>(`${this.base}/tree`, { params: { companyId } });
  }

  create(body: CreateDepartmentRequest): Observable<ApiResponse<DepartmentResponse>> {
    return this.http.post<ApiResponse<DepartmentResponse>>(this.base, body);
  }

  update(id: string, body: UpdateDepartmentRequest): Observable<ApiResponse<DepartmentResponse>> {
    return this.http.put<ApiResponse<DepartmentResponse>>(`${this.base}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
