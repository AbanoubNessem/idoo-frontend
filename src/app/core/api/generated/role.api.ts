import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../tokens/app-config.token';
import { ApiResponse, PageResponse, PageParams, RoleResponse, RoleRequest, PermissionResponse, AssignPermissionsRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class RoleApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly base = `${this.config.apiUrl}/v1/roles`;

  getAll(params?: PageParams & { includeSystemRoles?: boolean }): Observable<ApiResponse<PageResponse<RoleResponse>>> {
    return this.http.get<ApiResponse<PageResponse<RoleResponse>>>(this.base, { params: params as Record<string, string | boolean | number> });
  }

  getById(id: string): Observable<ApiResponse<RoleResponse>> {
    return this.http.get<ApiResponse<RoleResponse>>(`${this.base}/${id}`);
  }

  create(body: RoleRequest): Observable<ApiResponse<RoleResponse>> {
    return this.http.post<ApiResponse<RoleResponse>>(this.base, body);
  }

  update(id: string, body: RoleRequest): Observable<ApiResponse<RoleResponse>> {
    return this.http.put<ApiResponse<RoleResponse>>(`${this.base}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getPermissions(roleId: string): Observable<ApiResponse<PermissionResponse[]>> {
    return this.http.get<ApiResponse<PermissionResponse[]>>(`${this.base}/${roleId}/permissions`);
  }

  assignPermissions(roleId: string, body: AssignPermissionsRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/${roleId}/permissions/assign`, body);
  }

  revokePermissions(roleId: string, body: AssignPermissionsRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/${roleId}/permissions/revoke`, body);
  }

  syncPermissions(roleId: string, body: AssignPermissionsRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/${roleId}/permissions/sync`, body);
  }
}
