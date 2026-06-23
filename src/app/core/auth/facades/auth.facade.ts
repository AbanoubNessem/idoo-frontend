import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, map, catchError, throwError, finalize } from 'rxjs';
import { AuthApiClient } from '../../api/generated/auth.api';
import { AuthStateService } from '../state/auth.state';
import { SessionManagerService } from '../services/session-manager.service';
import { SelectionTokenStorageService } from '../services/selection-token-storage.service';
import { LoggerService } from '../../logger/logger.service';
import { LoginRequest, TokenResponse, LoginResponseData } from '../../api/models';
import { ContextInitializationService } from '../../context/services/context-initialization.service';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly authApi = inject(AuthApiClient);
  private readonly authState = inject(AuthStateService);
  private readonly sessionManager = inject(SessionManagerService);
  private readonly selectionTokenStorage = inject(SelectionTokenStorageService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly contextInitService = inject(ContextInitializationService);

  login(credentials: LoginRequest): Observable<LoginResponseData> {
    this.logger.info('AUTH', 'Login started', { email: credentials.email });
    this.authState.setLoading(true);

    return this.authApi.login(credentials).pipe(
      tap(response => {
        this.logger.info('AUTH', 'Login response received', { requiresTenantSelection: response.data.requiresTenantSelection });
        
        const data = response.data;
        if (!data.requiresTenantSelection && data.accessToken && data.refreshToken) {
          this.logger.info('AUTH', 'Single tenant detected, finalizing login');
          this.finalizeLogin(data as TokenResponse);
          this.contextInitService.initializeContext().subscribe({
            next: () => {
              this.logger.info('ROUTER', 'NavigationStart => /dashboard');
              this.router.navigate(['/dashboard']);
            }
          });
        } else if (data.requiresTenantSelection && data.selectionToken) {
          this.logger.info('AUTH', 'Multiple tenants detected, redirecting to tenant selection');
          this.selectionTokenStorage.saveSelectionToken(data.selectionToken);
          this.logger.info('ROUTER', 'NavigationStart => /auth/select-tenant');
          this.router.navigate(['/auth/select-tenant']);
        }
      }),
      map(response => response.data),
      catchError(err => {
        this.logger.error('AUTH', 'Login failed', err);
        return throwError(() => err);
      }),
      finalize(() => this.authState.setLoading(false))
    );
  }

  finalizeLogin(token: TokenResponse): void {
    this.sessionManager.saveTokens(token.accessToken, token.refreshToken);
    if (token.user) {
      this.sessionManager.saveUser(token.user);
      this.authState.setUser(token.user);
    }
    this.authState.setTokens(token.accessToken, token.refreshToken);
    this.logger.info('AUTH', 'Final access token received and state updated');
  }

  logout(): void {
    this.logger.info('AUTH', 'Logout initiated');
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
