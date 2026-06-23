import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap, finalize } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);
  const started = Date.now();
  
  logger.info('HTTP REQUEST', `${req.method} ${req.urlWithParams}`);

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          const elapsed = Date.now() - started;
          logger.info('HTTP RESPONSE', `${req.method} ${req.urlWithParams}`, {
            status: event.status,
            duration: `${elapsed}ms`
          });
        }
      },
      error: (error: HttpErrorResponse) => {
        const elapsed = Date.now() - started;
        logger.error('HTTP ERROR', `${req.method} ${req.urlWithParams}`, {
          status: error.status,
          duration: `${elapsed}ms`,
          message: error.message
        });
      }
    })
  );
};
