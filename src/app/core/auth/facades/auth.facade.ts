import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, map, catchError, throwError, finalize } from 'rxjs';
import { AuthApiClient } from '../../api/generated/auth.api';
import { AuthStateService } from '../state/auth.state';
import { SessionManagerService } from '../services/session-manager.service';
import { SelectionTokenStorageService } from '../services/selection-token-storage.service';
import { LoggerService } from '../../logger/logger.service';
import { LoginRequest, TokenResponse, LoginResponseData, TenantSelectionRequest, UserInfo } from '../../api/models';
import { ContextInitializationService } from '../../context/services/context-initialization.service';
import { AuthFlowStore } from '../state/auth-flow.store';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly authApi = inject(AuthApiClient);
  private readonly authState = inject(AuthStateService);
  private readonly sessionManager = inject(SessionManagerService);
  private readonly selectionTokenStorage = inject(SelectionTokenStorageService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly contextInitService = inject(ContextInitializationService);
  private readonly authFlowStore = inject(AuthFlowStore);

  login(credentials: LoginRequest): void {
    this.logger.info('AUTH FLOW', 'Login submitted', { email: credentials.email });
    this.authFlowStore.setLoading(true);
    this.authFlowStore.setError(null);

    this.authApi.login(credentials).pipe(
      tap(response => {
        this.logger.info('AUTH FLOW', 'Login response received', { requiresTenantSelection: response.data.requiresTenantSelection });
        
        const data = response.data;
        if (!data.requiresTenantSelection && data.accessToken && data.refreshToken) {
          this.logger.info('AUTH FLOW', 'Final JWT received');
          this.finalizeLogin(data as TokenResponse);
          this.contextInitService.initializeContext().subscribe({
            next: () => {
              this.logger.info('AUTH FLOW', 'Redirecting dashboard');
              this.router.navigate(['/app/dashboard']);
            }
          });
        } else if (data.requiresTenantSelection && data.selectionToken) {
          this.logger.info('AUTH FLOW', 'Tenant selection required');
          this.selectionTokenStorage.saveSelectionToken(data.selectionToken);
          this.logger.info('AUTH FLOW', 'Selection token stored');
          this.authFlowStore.setLoginStep('tenant-selection');
          this.router.navigate(['/auth/select-tenant']);
        }
      }),
      catchError(err => {
        this.logger.error('AUTH ERROR', 'Login failed', err);
        this.authFlowStore.setError(err.error?.message || 'Login failed. Please try again.');
        return throwError(() => err);
      }),
      finalize(() => this.authFlowStore.setLoading(false))
    ).subscribe();
  }

  finalizeLogin(token: TokenResponse): void {
    this.sessionManager.saveTokens(token.accessToken, token.refreshToken);
    
    let user = token.user;
    
    // Fallback: If backend does not return user object, decode it from JWT
    if (!user && token.accessToken) {
      const payload = this.decodeJwt(token.accessToken);
      if (payload) {
        user = {
          id: payload.userId || payload.sub || '',
          email: payload.email || '',
          username: payload.preferred_username || payload.sub || '',
          firstName: payload.given_name || payload.firstName || '',
          lastName: payload.family_name || payload.lastName || '',
          fullName: payload.name || payload.fullName || 'Authenticated User',
          tenantId: payload.tenantId || null,
          companyId: payload.companyId || null,
          mustChangePassword: payload.mustChangePassword || false
        } as UserInfo;
      }
    }

    if (user) {
      this.sessionManager.saveUser(user);
      this.authState.setUser(user);
    } else {
      this.logger.warn('AUTH FLOW', 'User object could not be resolved from token response or JWT');
    }

    this.authState.setTokens(token.accessToken, token.refreshToken);
    this.logger.info('AUTH FLOW', 'Final access token received and state updated');
  }

  private decodeJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      this.logger.error('AUTH ERROR', 'Failed to decode JWT', e);
      return null;
    }
  }

  logout(): void {
    this.logger.info('AUTH FLOW', 'Logout initiated');
    this.authApi.logout().subscribe({
      complete: () => this.clearSessionAndNavigate(),
      error: () => this.clearSessionAndNavigate()
    });
  }

  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.sessionManager.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token'));
    }
    return this.authApi.refresh({ refreshToken }).pipe(
      tap(response => {
        const token = response.data;
        this.sessionManager.saveTokens(token.accessToken, token.refreshToken);
        this.authState.setTokens(token.accessToken, token.refreshToken);
        this.logger.info('AUTH', 'Session refreshed successfully');
      }),
      map(response => response.data)
    );
  }

  restoreSession(): void {
    const accessToken = this.sessionManager.getAccessToken();
    const refreshToken = this.sessionManager.getRefreshToken();
    const user = this.sessionManager.getUser();

    if (accessToken && refreshToken && user) {
      this.logger.info('AUTH', 'Restoring session from storage');
      this.authState.setTokens(accessToken, refreshToken);
      this.authState.setUser(user);
    } else {
      this.logger.warn('AUTH', 'No valid session found during restore');
    }
  }

  private clearSessionAndNavigate(): void {
    this.sessionManager.clearSession();
    this.selectionTokenStorage.clearSelectionToken();
    this.authState.clearAuth();
    this.logger.info('ROUTER', 'NavigationStart => /auth/login');
    this.router.navigate(['/auth/login']);
  }
}
