import { inject, Injectable, signal } from '@angular/core';
import { FormPermissionChecker } from '../../../core/platform/forms/form.types';
import { DEMO_DEFAULT_PERMISSIONS } from './mock-data';

@Injectable()
export class DemoPermissionChecker implements FormPermissionChecker {
  private readonly _granted = signal<Set<string>>(new Set(DEMO_DEFAULT_PERMISSIONS));

  hasPermission(permission: string): boolean {
    return this._granted().has(permission);
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(p => this._granted().has(p));
  }

  grantPermission(permission: string): void {
    this._granted.update(s => {
      const next = new Set(s);
      next.add(permission);
      return next;
    });
  }

  revokePermission(permission: string): void {
    this._granted.update(s => {
      const next = new Set(s);
      next.delete(permission);
      return next;
    });
  }

  getGranted(): string[] {
    return Array.from(this._granted());
  }
}
