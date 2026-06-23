import { Injectable, computed, signal, inject } from '@angular/core';
import { UserInfo } from '../../api/models';
import { LoggerService } from '../../logger/logger.service';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const INITIAL_STATE: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly logger = inject(LoggerService);
  private readonly _state = signal<AuthState>(INITIAL_STATE);

  // Selectors
  readonly state = this._state.asReadonly();
  readonly user = computed(() => this._state().user);
  readonly accessToken = computed(() => this._state().accessToken);
  readonly refreshToken = computed(() => this._state().refreshToken);
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly isLoading = computed(() => this._state().isLoading);
  readonly mustChangePassword = computed(() => this._state().user?.mustChangePassword ?? false);
  readonly tenantId = computed(() => this._state().user?.tenantId ?? null);
  readonly companyId = computed(() => this._state().user?.companyId ?? null);

  // Mutators
  setTokens(accessToken: string, refreshToken: string): void {
    this._state.update(s => {
      this.logger.debug('STATE', 'AuthState updated: setTokens');
      return { ...s, accessToken, refreshToken };
    });
  }

  setUser(user: UserInfo): void {
    this._state.update(s => {
      this.logger.debug('STATE', 'AuthState updated: setUser', { userId: user.id });
      return { ...s, user, isAuthenticated: true };
    });
  }

  setLoading(isLoading: boolean): void {
    this._state.update(s => {
      // this.logger.debug('STATE', `AuthState updated: setLoading = ${isLoading}`);
      return { ...s, isLoading };
    });
  }

  clearAuth(): void {
    this.logger.debug('STATE', 'AuthState cleared');
    this._state.set(INITIAL_STATE);
  }
}
