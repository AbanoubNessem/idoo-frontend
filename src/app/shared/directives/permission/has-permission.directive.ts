import {
  Directive, Input, TemplateRef, ViewContainerRef, inject, effect, input
} from '@angular/core';
import { PermissionStateService } from '../../../core/auth/state/permission.state';

/**
 * Usage:
 *   <button *hasPermission="'AUTH:users:create'">Create User</button>
 *   <div *hasPermission="['AUTH:users:create', 'AUTH:users:update']; mode: 'any'">...</div>
 */
@Directive({ selector: '[hasPermission]', standalone: true })
export class HasPermissionDirective {
  private readonly template = inject(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissionState = inject(PermissionStateService);

  @Input('hasPermission') permissions: string | string[] = [];
  @Input('hasPermissionMode') mode: 'all' | 'any' = 'all';

  constructor() {
    // Re-evaluate whenever the permission set signal changes
    effect(() => {
      // Access the signal to register a dependency
      this.permissionState.permissions();
      this.updateView();
    });
  }

  private updateView(): void {
    const codes = Array.isArray(this.permissions) ? this.permissions : [this.permissions];
    const hasAccess = this.mode === 'any'
      ? this.permissionState.hasAnyPermission(codes)
      : this.permissionState.hasAllPermissions(codes);

    this.viewContainer.clear();
    if (hasAccess) {
      this.viewContainer.createEmbeddedView(this.template);
    }
  }
}
