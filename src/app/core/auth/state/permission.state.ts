import { Injectable, computed, signal } from '@angular/core';
import { EffectivePermissionResponse } from '../../api/models';

@Injectable({ providedIn: 'root' })
export class PermissionStateService {
  private readonly _permissions = signal<EffectivePermissionResponse[]>([]);
  private readonly _permissionSet = signal<Set<string>>(new Set());

  readonly permissions = this._permissions.asReadonly();

  setPermissions(permissions: EffectivePermissionResponse[]): void {
    this._permissions.set(permissions);
    const allowed = permissions
      .filter(p => !p.isDenied)
      .map(p => p.permissionCode);
    this._permissionSet.set(new Set(allowed));
  }

  /**
   * O(1) permission check — Set lookup.
   * Format: MODULE:resource:action  e.g. AUTH:users:create
   */
  hasPermission(code: string): boolean {
    return this._permissionSet().has(code);
  }

  hasAnyPermission(codes: string[]): boolean {
    return codes.some(c => this.hasPermission(c));
  }

  hasAllPermissions(codes: string[]): boolean {
    return codes.every(c => this.hasPermission(c));
  }

  clearPermissions(): void {
    this._permissions.set([]);
    this._permissionSet.set(new Set());
  }
}
