import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError, catchError } from 'rxjs';
import { LoggerService } from '../logger/logger.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const apiError = error.error;
      const errorCode = apiError?.error?.code ?? 'UNKNOWN_ERROR';
      const errorMessage = apiError?.error?.message ?? apiError?.message ?? error.message;

      switch (error.status) {
        case 400:
          logger.warn('HTTP ERROR', `400 Validation — ${errorCode}`, { message: errorMessage, fieldErrors: apiError?.error?.fieldErrors });
          break;

        case 401:
          // JWT interceptor handles token refresh for 401s from non-auth endpoints.
          // If it reaches here, the refresh already failed.
          logger.warn('HTTP ERROR', `401 Unauthorized — ${errorCode}`);
          break;

        case 403:
          logger.warn('HTTP ERROR', `403 Forbidden — ${errorCode}`);
          router.navigate(['/403']);
          break;

        case 404:
          logger.warn('HTTP ERROR', `404 Not Found — ${req.url}`);
          break;

        case 409:
          logger.warn('HTTP ERROR', `409 Conflict — ${errorCode}`, { message: errorMessage });
          break;

        case 422:
          logger.warn('HTTP ERROR', `422 Business Rule — ${errorCode}`, { message: errorMessage });
          break;

        case 500:
          logger.error('HTTP ERROR', `500 Internal Server Error — ${req.url}`, { message: errorMessage });
          break;

        default:
          if (error.status === 0) {
            logger.error('HTTP ERROR', 'Network error or server unreachable', { url: req.url });
          } else {
            logger.error('HTTP ERROR', `Unexpected error ${error.status} — ${req.url}`);
          }
      }

      return throwError(() => error);
    })
  );
};
