import { Injectable, computed, signal } from '@angular/core';
import { Tenant, Company, Branch, FiscalYear } from '../models/framework-types';

@Injectable({ providedIn: 'root' })
export class ContextFacade {
  readonly currentTenant = signal<Tenant | null>(null);
  readonly currentCompany = signal<Company | null>(null);
  readonly currentBranch = signal<Branch | null>(null);
  readonly currentFiscalYear = signal<FiscalYear | null>(null);

  // Computed state for HTTP Interceptors
  readonly contextHeaders = computed(() => {
    const headers: Record<string, string> = {};
    const tenant = this.currentTenant();
    const company = this.currentCompany();
    const branch = this.currentBranch();
    const fiscalYear = this.currentFiscalYear();

    if (tenant) headers['X-Tenant-ID'] = tenant.id;
    if (company) headers['X-Company-ID'] = company.id;
    if (branch) headers['X-Branch-ID'] = branch.id;
    if (fiscalYear) headers['X-Fiscal-Year'] = fiscalYear.code;

    return headers;
  });

  setTenant(tenant: Tenant | null) {
    this.currentTenant.set(tenant);
    // Reset lower contexts if tenant changes
    if (tenant === null) {
      this.currentCompany.set(null);
      this.currentBranch.set(null);
    }
  }

  setCompany(company: Company | null) {
    this.currentCompany.set(company);
    if (company === null) {
      this.currentBranch.set(null);
    }
  }

  setBranch(branch: Branch | null) {
    this.currentBranch.set(branch);
  }

  setFiscalYear(fiscalYear: FiscalYear | null) {
    this.currentFiscalYear.set(fiscalYear);
  }

  setFullContext(tenant: Tenant, company: Company, branch: Branch) {
    this.currentTenant.set(tenant);
    this.currentCompany.set(company);
    this.currentBranch.set(branch);
  }
}
