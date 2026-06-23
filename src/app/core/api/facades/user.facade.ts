import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { UserApiClient } from '../generated/user.api';
import {
  UserResponse, UserRequest, UserUpdateRequest, PageResponse, PageParams,
  UserRoleResponse, AssignRoleRequest, BranchSummaryResponse, AssignBranchRequest,
  EffectivePermissionResponse, UserPermissionResponse, GrantPermissionRequest,
  DenyPermissionRequest, RevokePermissionRequest, RevokeRoleRequest, RevokeBranchRequest
} from '../models';

/**
 * Facade: isolates components from direct API client calls.
 * Returns unwrapped domain objects — no ApiResponse<T> leaks into feature modules.
 */
@Injectable({ providedIn: 'root' })
export class UserFacade {
  private readonly api = inject(UserApiClient);

  getUsers(params?: PageParams & { status?: string; companyId?: string; branchId?: string }): Observable<PageResponse<UserResponse>> {
    return this.api.getAll(params).pipe(map(r => r.data));
  }

  getUser(id: string): Observable<UserResponse> {
    return this.api.getById(id).pipe(map(r => r.data));
  }

  createUser(body: UserRequest): Observable<UserResponse> {
    return this.api.create(body).pipe(map(r => r.data));
  }

  updateUser(id: string, body: UserUpdateRequest): Observable<UserResponse> {
    return this.api.update(id, body).pipe(map(r => r.data));
  }

  deleteUser(id: string): Observable<void> {
    return this.api.delete(id);
  }

  activateUser(id: string): Observable<void> { return this.api.activate(id); }
  deactivateUser(id: string): Observable<void> { return this.api.deactivate(id); }
  unlockUser(id: string): Observable<void> { return this.api.unlock(id); }
  resetPassword(id: string): Observable<void> { return this.api.resetPassword(id); }
  forcePasswordChange(id: string): Observable<void> { return this.api.forcePasswordChange(id); }

  // Roles
  getUserRoles(userId: string): Observable<UserRoleResponse[]> {
    return this.api.getUserRoleAssignments(userId).pipe(map(r => r.data));
  }

  assignRole(userId: string, body: AssignRoleRequest): Observable<void> {
    return this.api.assignRole(userId, body);
  }

  revokeRole(userId: string, body: RevokeRoleRequest): Observable<void> {
    return this.api.revokeRole(userId, body);
  }

  // Branches
  getUserBranches(userId: string): Observable<BranchSummaryResponse[]> {
    return this.api.getUserBranches(userId).pipe(map(r => r.data));
  }

  assignBranch(userId: string, body: AssignBranchRequest): Observable<void> {
    return this.api.assignBranch(userId, body);
  }

  revokeBranch(userId: string, body: RevokeBranchRequest): Observable<void> {
    return this.api.revokeBranch(userId, body);
  }

  setPrimaryBranch(userId: string, branchId: string): Observable<void> {
    return this.api.setPrimaryBranch(userId, branchId);
  }

  // Permissions
  getDirectPermissions(userId: string): Observable<UserPermissionResponse[]> {
    return this.api.getDirectPermissions(userId).pipe(map(r => r.data));
  }

  getEffectivePermissions(userId: string): Observable<EffectivePermissionResponse[]> {
    return this.api.getEffectivePermissionsByUser(userId).pipe(map(r => r.data));
  }

  grantPermission(userId: string, body: GrantPermissionRequest): Observable<void> {
    return this.api.grantPermission(userId, body);
  }

  denyPermission(userId: string, body: DenyPermissionRequest): Observable<void> {
    return this.api.denyPermission(userId, body);
  }

  revokePermission(userId: string, body: RevokePermissionRequest): Observable<void> {
    return this.api.revokePermission(userId, body);
  }
}
