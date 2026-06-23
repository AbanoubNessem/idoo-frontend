import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, map, catchError, throwError, finalize } from 'rxjs';
import { AuthApiClient } from '../../api/generated/auth.api';
import { AuthStateService } from '../state/auth.state';
import { SelectionTokenStorageService } from '../services/selection-token-storage.service';
import { AuthFacade } from './auth.facade';
import { LoggerService } from '../../logger/logger.service';
import { AvailableTenant, TokenResponse, TenantSelectionRequest } from '../../api/models';
import { ContextInitializationService } from '../../context/services/context-initialization.service';

@Injectable({ providedIn: 'root' })
export class TenantSelectionFacade {
  private readonly authApi = inject(AuthApiClient);
  private readonly authState = inject(AuthStateService);
  private readonly selectionTokenStorage = inject(SelectionTokenStorageService);
  private readonly authFacade = inject(AuthFacade);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly contextInitService = inject(ContextInitializationService);

  getAvailableTenants(): Observable<AvailableTenant[]> {
    const selectionToken = this.selectionTokenStorage.getSelectionToken();
    if (!selectionToken) {
      this.logger.error('AUTH', 'No selection token found, redirecting to login');
      this.router.navigate(['/auth/login']);
      return throwError(() => new Error('No selection token found'));
    }

    this.logger.info('AUTH', 'Loading available tenants');
    this.authState.setLoading(true);
    
    return this.authApi.getAvailableTenants(selectionToken).pipe(
      map(response => response.data),
      tap(tenants => {
        this.logger.info('AUTH', 'Available tenants loaded', { count: tenants ? tenants.length : 0 });
      }),
      catchError(err => {
        this.logger.error('AUTH', 'Failed to load available tenants', err);
        return throwError(() => err);
      }),
      finalize(() => this.authState.setLoading(false))
    );
  }

  selectTenant(tenantId: string): Observable<TokenResponse> {
    const selectionToken = this.selectionTokenStorage.getSelectionToken();
    if (!selectionToken) {
      this.router.navigate(['/auth/login']);
      return throwError(() => new Error('No selection token found'));
    }

    this.logger.info('AUTH', 'Tenant selected', { tenantId });
    this.authState.setLoading(true);
    const request: TenantSelectionRequest = { selectionToken, tenantId };

    return this.authApi.selectTenant(request).pipe(
      tap(response => {
        const token = response.data;
        this.selectionTokenStorage.clearSelectionToken();
        this.authFacade.finalizeLogin(token);
        
        // After tenant selection, initialize context
        this.contextInitService.initializeContext().subscribe({
          next: () => {
             this.logger.info('ROUTER', 'NavigationStart => /dashboard');
             this.router.navigate(['/dashboard']);
          }
        });
      }),
      map(response => response.data),
      catchError(err => {
        this.logger.error('AUTH', 'Tenant selection failed', err);
        return throwError(() => err);
      }),
      finalize(() => this.authState.setLoading(false))
    );
  }
}
