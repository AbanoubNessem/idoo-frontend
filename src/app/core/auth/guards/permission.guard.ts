import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { PermissionStateService } from '../state/permission.state';

/**
 * Usage in route config:
 *   canActivate: [permissionGuard],
 *   data: { permissions: ['AUTH:users:create'] }
 */
export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const permissionState = inject(PermissionStateService);
  const router = inject(Router);

  const requiredPermissions: string[] = route.data['permissions'] ?? [];

  if (!requiredPermissions.length || permissionState.hasAllPermissions(requiredPermissions)) {
    return true;
  }

  return router.createUrlTree(['/403']);
};
