import { Injectable, computed, signal, inject } from '@angular/core';
import { AvailableTenant } from '../../api/models';
import { LoggerService } from '../../logger/logger.service';

export interface AuthFlowState {
  loading: boolean;
  error: string | null;
  loginStep: 'login' | 'tenant-selection';
  tenants: AvailableTenant[];
  selectedTenantId: string | null;
}

const INITIAL_STATE: AuthFlowState = {
  loading: false,
  error: null,
  loginStep: 'login',
  tenants: [],
  selectedTenantId: null
};

@Injectable({ providedIn: 'root' })
export class AuthFlowStore {
  private readonly logger = inject(LoggerService);
  private readonly _state = signal<AuthFlowState>(INITIAL_STATE);

  readonly state = this._state.asReadonly();
  
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly loginStep = computed(() => this._state().loginStep);
  readonly tenants = computed(() => this._state().tenants);
  readonly selectedTenantId = computed(() => this._state().selectedTenantId);

  setLoading(loading: boolean): void {
    this._state.update(s => ({ ...s, loading }));
  }

  setError(error: string | null): void {
    if (error) this.logger.error('AUTH FLOW', error);
    this._state.update(s => ({ ...s, error }));
  }

  setLoginStep(loginStep: 'login' | 'tenant-selection'): void {
    this.logger.debug('AUTH FLOW', `Step changed to: ${loginStep}`);
    this._state.update(s => ({ ...s, loginStep }));
  }

  setTenants(tenants: AvailableTenant[]): void {
    this.logger.debug('AUTH FLOW', `Loaded tenants count: ${tenants.length}`);
    this._state.update(s => ({ ...s, tenants }));
  }

  setSelectedTenantId(selectedTenantId: string | null): void {
    if (selectedTenantId) this.logger.debug('AUTH FLOW', `Tenant selected: ${selectedTenantId}`);
    this._state.update(s => ({ ...s, selectedTenantId }));
  }

  reset(): void {
    this._state.set(INITIAL_STATE);
  }
}
