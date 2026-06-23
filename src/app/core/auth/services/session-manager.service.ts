import { Injectable, inject } from '@angular/core';
import { UserInfo } from '../../api/models';
import { LoggerService } from '../../logger/logger.service';

@Injectable({ providedIn: 'root' })
export class SessionManagerService {
  private readonly logger = inject(LoggerService);

  private readonly ACCESS_TOKEN_KEY = 'auth_access_token';
  private readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';
  private readonly USER_KEY = 'auth_user';

  saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    this.logger.debug('SessionManagerService', 'Tokens saved to local storage');
  }

  saveUser(user: UserInfo): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.logger.debug('SessionManagerService', 'User saved to local storage', user);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getUser(): UserInfo | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson) as UserInfo;
    } catch (e) {
      this.logger.error('SessionManagerService', 'Failed to parse user from storage', e);
      return null;
    }
  }

  clearSession(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.logger.debug('SessionManagerService', 'Session cleared from local storage');
  }

  hasValidSession(): boolean {
    return !!this.getAccessToken();
  }
}
