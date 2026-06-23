import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../tokens/app-config.token';
import {
  ApiResponse, PageResponse, PageParams,
  UserResponse, UserRequest, UserUpdateRequest,
  UserRoleResponse, AssignRoleRequest, RevokeRoleRequest,
  BranchSummaryResponse, AssignBranchRequest, RevokeBranchRequest,
  UserPermissionResponse, EffectivePermissionResponse,
  GrantPermissionRequest, DenyPermissionRequest, RevokePermissionRequest,
  RoleSummaryResponse
} from '../models';

@Injectable({ providedIn: 'root' })
export class UserApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly base = `${this.config.apiUrl}/v1/users`;

  // Users
  getAll(params?: PageParams & { status?: string; companyId?: string; branchId?: string }): Observable<ApiResponse<PageResponse<UserResponse>>> {
    return this.http.get<ApiResponse<PageResponse<UserResponse>>>(this.base, { params: params as Record<string, string | number> });
  }

  getById(id: string): Observable<ApiResponse<UserResponse>> {
    return this.http.get<ApiResponse<UserResponse>>(`${this.base}/${id}`);
  }

  create(body: UserRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.post<ApiResponse<UserResponse>>(this.base, body);
  }

  update(id: string, body: UserUpdateRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.put<ApiResponse<UserResponse>>(`${this.base}/${id}`, body);
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

  unlock(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/unlock`, null);
  }

  resetPassword(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/reset-password`, null);
  }

  forcePasswordChange(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/force-password-change`, null);
  }

  getUserRoles(id: string): Observable<ApiResponse<RoleSummaryResponse[]>> {
    return this.http.get<ApiResponse<RoleSummaryResponse[]>>(`${this.base}/${id}/roles`);
  }

  getEffectivePermissions(id: string): Observable<ApiResponse<EffectivePermissionResponse[]>> {
    return this.http.get<ApiResponse<EffectivePermissionResponse[]>>(`${this.base}/${id}/permissions`);
  }

  // Roles
  getUserRoleAssignments(userId: string): Observable<ApiResponse<UserRoleResponse[]>> {
    return this.http.get<ApiResponse<UserRoleResponse[]>>(`${this.base}/${userId}/roles`);
  }

  assignRole(userId: string, body: AssignRoleRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/${userId}/roles/assign`, body);
  }

  revokeRole(userId: string, body: RevokeRoleRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/${userId}/roles/revoke`, body);
  }

  // Branches
  getUserBranches(userId: string): Observable<ApiResponse<BranchSummaryResponse[]>> {
    return this.http.get<ApiResponse<BranchSummaryResponse[]>>(`${this.base}/${userId}/branches`);
  }

  assignBranch(userId: string, body: AssignBranchRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/${userId}/branches`, body);
  }

  revokeBranch(userId: string, body: RevokeBranchRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/${userId}/branches/revoke`, body);
  }

  setPrimaryBranch(userId: string, branchId: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${userId}/branches/${branchId}/set-primary`, null);
  }

  // Direct Permissions
  getDirectPermissions(userId: string): Observable<ApiResponse<UserPermissionResponse[]>> {
    return this.http.get<ApiResponse<UserPermissionResponse[]>>(`${this.base}/${userId}/permissions`);
  }

  getEffectivePermissionsByUser(userId: string): Observable<ApiResponse<EffectivePermissionResponse[]>> {
    return this.http.get<ApiResponse<EffectivePermissionResponse[]>>(`${this.base}/${userId}/permissions/effective`);
  }

  grantPermission(userId: string, body: GrantPermissionRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/${userId}/permissions/grant`, body);
  }

  denyPermission(userId: string, body: DenyPermissionRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/${userId}/permissions/deny`, body);
  }

  revokePermission(userId: string, body: RevokePermissionRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/${userId}/permissions/revoke`, body);
  }
}
