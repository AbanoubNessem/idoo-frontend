import { Injectable, inject } from '@angular/core';
import { ContextStateService } from '../state/context.state';
import { WorkspaceContext } from '../models/context.models';

@Injectable({ providedIn: 'root' })
export class ContextFacade {
  private readonly contextState = inject(ContextStateService);

  readonly tenantId = this.contextState.tenantId;
  readonly companyId = this.contextState.companyId;
  readonly branchId = this.contextState.branchId;
  readonly currentContext = this.contextState.currentContext;

  setTenant(tenantId: string): void {
    this.contextState.setTenant(tenantId);
    this.persistContext();
  }

  setCompany(companyId: string): void {
    this.contextState.setCompany(companyId);
    this.persistContext();
  }

  setBranch(branchId: string): void {
    this.contextState.setBranch(branchId);
    this.persistContext();
  }

  clearContext(): void {
    this.contextState.clearContext();
    localStorage.removeItem('workspace_context');
  }

  restoreContext(): void {
    const saved = localStorage.getItem('workspace_context');
    if (saved) {
      try {
        const parsed: WorkspaceContext = JSON.parse(saved);
        if (parsed.tenantId) this.contextState.setTenant(parsed.tenantId);
        if (parsed.companyId) this.contextState.setCompany(parsed.companyId);
        if (parsed.branchId) this.contextState.setBranch(parsed.branchId);
      } catch (e) {
        console.error('Failed to parse workspace context from storage', e);
      }
    }
  }

  private persistContext(): void {
    localStorage.setItem('workspace_context', JSON.stringify(this.currentContext()));
  }
}
