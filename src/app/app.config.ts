import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/auth/interceptors/jwt.interceptor';
import { contextInterceptor } from './core/context/interceptors/context.interceptor';
import { loggingInterceptor } from './core/interceptors/logging.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { provideRegistry } from './core/registry/providers/registry.provider';
import { APP_CONFIG } from './core/tokens/app-config.token';
import { AuthFacade } from './core/auth/facades/auth.facade';

function restoreSessionFactory(authFacade: AuthFacade) {
  return () => authFacade.restoreSession();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([loggingInterceptor, errorInterceptor, jwtInterceptor, contextInterceptor])),
    provideRegistry(),
    { provide: APP_CONFIG, useValue: { apiUrl: 'http://localhost:8080/api', production: false } },
    {
      provide: APP_INITIALIZER,
      useFactory: restoreSessionFactory,
      deps: [AuthFacade],
      multi: true
    }
  ]
};
