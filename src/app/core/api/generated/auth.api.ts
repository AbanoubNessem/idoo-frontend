import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../tokens/app-config.token';
import { ApiResponse, LoginRequest, RefreshTokenRequest, TokenResponse, LoginResponseData, AvailableTenant, TenantSelectionRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly base = `${this.config.apiUrl}/api/v1/auth`;

  login(body: LoginRequest): Observable<ApiResponse<LoginResponseData>> {
    return this.http.post<ApiResponse<LoginResponseData>>(`${this.base}/login`, body);
  }

  getAvailableTenants(selectionToken: string): Observable<ApiResponse<AvailableTenant[]>> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${selectionToken}`);
    return this.http.get<ApiResponse<AvailableTenant[]>>(`${this.base}/available-tenants`, { headers });
  }

  selectTenant(body: TenantSelectionRequest): Observable<ApiResponse<TokenResponse>> {
    return this.http.post<ApiResponse<TokenResponse>>(`${this.base}/select-tenant`, body);
  }

  refresh(body: RefreshTokenRequest): Observable<ApiResponse<TokenResponse>> {
    return this.http.post<ApiResponse<TokenResponse>>(`${this.base}/refresh`, body);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/logout`, null);
  }
}
