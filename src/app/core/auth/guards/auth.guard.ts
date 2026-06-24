import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../state/auth.state';

export const authGuard: CanActivateFn = (route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  console.group('AUTH GUARD');
  console.log('Current URL', state.url);
  console.log('Is Authenticated', authState.isAuthenticated());
  console.groupEnd();

  if (authState.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};
