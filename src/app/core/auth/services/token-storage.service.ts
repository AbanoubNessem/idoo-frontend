import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY = 'idoo_access_token';
const REFRESH_TOKEN_KEY = 'idoo_refresh_token';
const USER_DATA_KEY = 'idoo_user_data';

/**
 * Wraps localStorage for token persistence.
 * Centralised here so the storage strategy can be swapped (e.g. to httpOnly cookie).
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  saveUser(user: any): void {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  }

  getUser(): any | null {
    const userStr = localStorage.getItem(USER_DATA_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  }
}
