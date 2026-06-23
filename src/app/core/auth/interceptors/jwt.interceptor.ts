import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, switchMap, filter, take, catchError } from 'rxjs';
import { AuthStateService } from '../state/auth.state';
import { AuthFacade } from '../facades/auth.facade';
import { SessionManagerService } from '../services/session-manager.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authState = inject(AuthStateService);
  const authFacade = inject(AuthFacade);
  const sessionManager = inject(SessionManagerService);

  const token = authState.accessToken();
  const authReq = token ? addTokenHeader(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/')) {
        return handle401Error(req, next, authFacade, sessionManager);
      }
      return throwError(() => error);
    }),
  );
};

function addTokenHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) });
}

function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authFacade: AuthFacade,
  sessionManager: SessionManagerService,
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authFacade.refreshToken().pipe(
      switchMap(token => {
        isRefreshing = false;
        refreshTokenSubject.next(token.accessToken);
        return next(addTokenHeader(req, token.accessToken));
      }),
      catchError(err => {
        isRefreshing = false;
        authFacade.logout();
        return throwError(() => err);
      }),
    );
  }

  return refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap(token => next(addTokenHeader(req, token!))),
  );
}
