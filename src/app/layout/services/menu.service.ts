import { inject, Injectable, signal } from '@angular/core';
import { ModuleApiClient } from '../../core/api/generated/module.api';
import { PermissionStateService } from '../../core/auth/state/permission.state';
import { MenuItem } from './menu.models';

/**
 * Builds the sidebar dynamically from backend-registered modules,
 * filtered by the current user's effective permissions.
 *
 * Module → menu item mapping is data-driven; adding a new backend module
 * automatically surfaces it in the UI without frontend code changes,
 * as long as a route convention (`/app/{module-code-lowercase}`) is registered.
 */
@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly moduleApi = inject(ModuleApiClient);
  private readonly permissionState = inject(PermissionStateService);

  private readonly _menuItems = signal<MenuItem[]>([]);
  readonly menuItems = this._menuItems.asReadonly();

  loadMenu(): void {
    this.moduleApi.getAll().subscribe({
      next: response => {
        const items = response.data
          .filter(m => m.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(m => this.toMenuItem(m))
          .filter(item => this.isVisible(item));
        this._menuItems.set(items);
      },
    });
  }

  private toMenuItem(module: { code: string; name: string; icon: string; sortOrder: number }): MenuItem {
    return {
      moduleCode: module.code,
      label: module.name,
      icon: module.icon || 'apps',
      route: `/app/${module.code.toLowerCase()}`,
      permission: `${module.code}:view`,
      sortOrder: module.sortOrder,
    };
  }

  private isVisible(item: MenuItem): boolean {
    return !item.permission || this.permissionState.hasPermission(item.permission);
  }
}
