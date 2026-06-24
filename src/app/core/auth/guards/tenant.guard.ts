import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../state/auth.state';

export const tenantGuard: CanActivateFn = (route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  console.group('TENANT GUARD');
  console.log('Current URL', state.url);
  console.log('Tenant Context', authState.tenantId());
  console.groupEnd();

  if (authState.tenantId()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};
