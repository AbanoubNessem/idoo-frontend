import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ContextFacade } from '../facades/context.facade';

const AUTH_PATH_FRAGMENT = '/v1/auth/';

export const contextInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Auth endpoints are public — never inject workspace context headers
  if (req.url.includes(AUTH_PATH_FRAGMENT)) {
    return next(req);
  }

  const contextFacade = inject(ContextFacade);

  const tenantId = contextFacade.tenantId();
  const companyId = contextFacade.companyId();
  const branchId = contextFacade.branchId();

  let headers = req.headers;

  if (tenantId) {
    headers = headers.set('X-Tenant-ID', tenantId);
  }

  if (companyId) {
    headers = headers.set('X-Company-ID', companyId);
  }

  if (branchId) {
    headers = headers.set('X-Branch-ID', branchId);
  }

  return next(req.clone({ headers }));
};
