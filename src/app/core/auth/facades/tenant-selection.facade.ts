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
import { AuthFlowStore } from '../state/auth-flow.store';

@Injectable({ providedIn: 'root' })
export class TenantSelectionFacade {
  private readonly authApi = inject(AuthApiClient);
  private readonly authState = inject(AuthStateService);
  private readonly selectionTokenStorage = inject(SelectionTokenStorageService);
  private readonly authFacade = inject(AuthFacade);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly contextInitService = inject(ContextInitializationService);
  private readonly authFlowStore = inject(AuthFlowStore);

  getAvailableTenants(): void {
    const selectionToken = this.selectionTokenStorage.getSelectionToken();
    if (!selectionToken) {
      this.logger.error('AUTH ERROR', 'Selection token missing');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.logger.info('AUTH API', 'GET /auth/available-tenants');
    this.authFlowStore.setLoading(true);
    this.authFlowStore.setError(null);
    
    this.authApi.getAvailableTenants(selectionToken).pipe(
      map(response => response.data),
      tap(tenants => {
        const t = tenants || [];
        this.authFlowStore.setTenants(t);
        if (t.length === 0) {
          this.authFlowStore.setError('No workspaces available.');
        }
      }),
      catchError(err => {
        this.logger.error('AUTH ERROR', 'Tenant loading failed', err);
        this.authFlowStore.setError('Could not load available tenants.');
        return throwError(() => err);
      }),
      finalize(() => this.authFlowStore.setLoading(false))
    ).subscribe();
  }

  selectTenant(tenantId: string): void {
    const selectionToken = this.selectionTokenStorage.getSelectionToken();
    if (!selectionToken) {
      this.logger.error('AUTH ERROR', 'Selection token missing');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.logger.info('AUTH FLOW', 'Tenant selected:', { tenantId });
    this.authFlowStore.setLoading(true);
    this.authFlowStore.setError(null);
    const request: TenantSelectionRequest = { selectionToken, tenantId };

    this.authApi.selectTenant(request).pipe(
      tap(response => {
        this.logger.info('AUTH FLOW', 'Final JWT received');
        const token = response.data;
        this.selectionTokenStorage.clearSelectionToken();
        this.authFacade.finalizeLogin(token);
        
        // After tenant selection, initialize context
        this.contextInitService.initializeContext().subscribe({
          next: () => {
             this.logger.info('AUTH FLOW', 'Redirecting dashboard');
             this.router.navigate(['/app/dashboard']);
          }
        });
      }),
      catchError(err => {
        this.logger.error('AUTH ERROR', 'Select tenant failed', err);
        this.authFlowStore.setError(err.error?.message || 'Tenant selection failed. Please try again.');
        return throwError(() => err);
      }),
      finalize(() => this.authFlowStore.setLoading(false))
    ).subscribe();
  }
}
