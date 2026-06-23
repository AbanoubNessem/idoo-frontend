import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, map, finalize } from 'rxjs';
import { AuthApiClient } from '../../api/generated/auth.api';
import { UserApiClient } from '../../api/generated/user.api';
import { AuthStateService } from '../state/auth.state';
import { PermissionStateService } from '../state/permission.state';
import { TokenStorageService } from './token-storage.service';
import { LoginRequest, TokenResponse, LoginResponseData, AvailableTenant, TenantSelectionRequest } from '../../api/models';
import { ContextFacade } from '../../context/facades/context.facade';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthApiClient);
  private readonly userApi = inject(UserApiClient);
  private readonly authState = inject(AuthStateService);
  private readonly permissionState = inject(PermissionStateService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly contextFacade = inject(ContextFacade);
  private readonly router = inject(Router);

  login(credentials: LoginRequest): Observable<LoginResponseData> {
    this.authState.setLoading(true);
    return this.authApi.login(credentials).pipe(
      tap(response => {
        const data = response.data;
        if (!data.requiresTenantSelection && data.user && data.accessToken && data.refreshToken) {
          this.finalizeLogin(data as TokenResponse);
          this.router.navigate(['/dashboard']);
        } else if (data.requiresTenantSelection && data.selectionToken) {
          // Temporarily store selection token for the next step
          sessionStorage.setItem('selection_token', data.selectionToken);
          this.router.navigate(['/auth/select-tenant']);
        }
      }),
      map(response => response.data),
      catchError(err => throwError(() => err)),
      finalize(() => this.authState.setLoading(false))
    );
  }

  getAvailableTenants(): Observable<AvailableTenant[]> {
    const selectionToken = sessionStorage.getItem('selection_token');
    if (!selectionToken) {
      this.router.navigate(['/auth/login']);
      return throwError(() => new Error('No selection token found'));
    }
    this.authState.setLoading(true);
    return this.authApi.getAvailableTenants(selectionToken).pipe(
      map(response => response.data),
      tap(response => console.log('Response from getAvailableTenants:', response)),
      catchError(
        err => throwError(() => err)
      ),
      finalize(() => this.authState.setLoading(false))
    );
  }

  selectTenant(tenantId: string): Observable<TokenResponse> {
    const selectionToken = sessionStorage.getItem('selection_token');
    if (!selectionToken) {
      this.router.navigate(['/auth/login']);
      return throwError(() => new Error('No selection token found'));
    }
    
    this.authState.setLoading(true);
    const request: TenantSelectionRequest = { selectionToken, tenantId };
    
    return this.authApi.selectTenant(request).pipe(
      tap(response => {
        const token = response.data;
        sessionStorage.removeItem('selection_token');
        this.finalizeLogin(token);
        this.router.navigate(['/dashboard']);
      }),
      map(response => response.data),
      catchError(err => throwError(() => err)),
      finalize(() => this.authState.setLoading(false))
    );
  }

  private finalizeLogin(token: TokenResponse): void {
    this.tokenStorage.saveTokens(token.accessToken, token.refreshToken);
    if (token.user) {
      this.tokenStorage.saveUser(token.user);
      this.authState.setUser(token.user);
      this.loadUserPermissions(token.user.id);
    }
    this.authState.setTokens(token.accessToken, token.refreshToken);
  }

  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token'));
    }
    return this.authApi.refresh({ refreshToken }).pipe(
      tap(response => {
        const token = response.data;
        this.tokenStorage.saveTokens(token.accessToken, token.refreshToken);
        this.authState.setTokens(token.accessToken, token.refreshToken);
      }),
      map(response => response.data)
    );
  }

  logout(): void {
    this.authApi.logout().subscribe({
      complete: () => this.clearSessionAndNavigate(),
      error: () => this.clearSessionAndNavigate(),
    });
  }

  restoreSession(): void {
    const accessToken = this.tokenStorage.getAccessToken();
    const refreshToken = this.tokenStorage.getRefreshToken();
    const user = this.tokenStorage.getUser();
    
    if (accessToken && refreshToken && user) {
      this.authState.setTokens(accessToken, refreshToken);
      this.authState.setUser(user);
      this.loadUserPermissions(user.id);
    }
    
    // Also restore context (Tenant/Company/Branch)
    this.contextFacade.restoreContext();
  }

  private loadUserPermissions(userId: string): void {
    this.userApi.getEffectivePermissions(userId).subscribe({
      next: response => this.permissionState.setPermissions(response.data),
    });
  }

  private clearSessionAndNavigate(): void {
    this.tokenStorage.clearTokens();
    this.authState.clearAuth();
    this.permissionState.clearPermissions();
    this.contextFacade.clearContext();
    this.router.navigate(['/auth/login']);
  }
}
