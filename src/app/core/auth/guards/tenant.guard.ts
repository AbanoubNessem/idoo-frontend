import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../state/auth.state';

export const tenantGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (authState.tenantId()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};
