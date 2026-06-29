import { Injectable, inject } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class NavigationEngineService {
  private readonly router = inject(Router);

  navigateTo(path: string | string[], extras?: NavigationExtras): Promise<boolean> {
    const commands = Array.isArray(path) ? path : [path];
    return this.router.navigate(commands, extras);
  }

  navigateToEntity(entityPath: string, id?: string, mode: 'detail' | 'edit' | 'create' = 'detail'): Promise<boolean> {
    const base = entityPath.startsWith('/') ? entityPath : `/${entityPath}`;
    if (mode === 'create') return this.router.navigate([base, 'create']);
    if (id) return this.router.navigate([base, id, mode === 'edit' ? 'edit' : '']);
    return this.router.navigate([base]);
  }

  back(): void {
    window.history.back();
  }

  getCurrentPath(): string {
    return this.router.url;
  }

  isActive(path: string, exact = false): boolean {
    return this.router.isActive(path, {
      paths: exact ? 'exact' : 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }

  buildUrl(path: string, queryParams?: Record<string, unknown>): string {
    const tree = this.router.createUrlTree([path], { queryParams });
    return this.router.serializeUrl(tree);
  }
}
