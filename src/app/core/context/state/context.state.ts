import { Injectable, signal, computed } from '@angular/core';
import { WorkspaceContext } from '../models/context.models';

@Injectable({ providedIn: 'root' })
export class ContextStateService {
  private readonly _state = signal<WorkspaceContext>({
    tenantId: null,
    companyId: null,
    branchId: null,
  });

  public readonly tenantId = computed(() => this._state().tenantId);
  public readonly companyId = computed(() => this._state().companyId);
  public readonly branchId = computed(() => this._state().branchId);
  
  public readonly currentContext = computed(() => this._state());

  setTenant(tenantId: string): void {
    this._state.update(state => ({ ...state, tenantId }));
  }

  setCompany(companyId: string): void {
    this._state.update(state => ({ ...state, companyId }));
  }

  setBranch(branchId: string): void {
    this._state.update(state => ({ ...state, branchId }));
  }

  clearContext(): void {
    this._state.set({ tenantId: null, companyId: null, branchId: null });
  }
}
