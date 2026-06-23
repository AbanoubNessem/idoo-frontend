import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TenantSelectionFacade } from '../../../core/auth/facades/tenant-selection.facade';
import { AuthFlowStore } from '../../../core/auth/state/auth-flow.store';
import { AvailableTenant } from '../../../core/api/models';
import { TenantCardComponent } from '../components/tenant-card/tenant-card.component';
import { ButtonSpinnerComponent } from '../../../shared/components/button-spinner/button-spinner.component';

@Component({
  selector: 'app-select-tenant',
  standalone: true,
  imports: [CommonModule, FormsModule, TenantCardComponent, ButtonSpinnerComponent],
  template: `
    <div class="auth-card">
      <div class="login-header">
        <h1 class="brand-logo">iDoo <span>ERP</span></h1>
        <h2>Select Your Workspace</h2>
        <p>You have access to multiple workspaces.</p>
      </div>

      <div class="tenant-selection-container">
        <div class="search-box">
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Search workspace..."
            class="search-input" />
        </div>

        <div class="tenants-list" *ngIf="filteredTenants().length > 0">
          <app-tenant-card 
            *ngFor="let tenant of filteredTenants()" 
            [tenant]="tenant"
            [selected]="selectedTenantId() === tenant.id"
            (selectTenant)="onSelect(tenant.id)">
          </app-tenant-card>
        </div>
        
        <div class="no-results" *ngIf="filteredTenants().length === 0 && !loading()">
          <p>No workspaces found matching "{{ searchQuery }}"</p>
        </div>

        <div *ngIf="error()" class="error-message" role="alert">
          {{ error() }}
        </div>

        <div class="action-buttons">
          <button type="button" class="btn-secondary" (click)="goBack()" [disabled]="loading()">Cancel</button>
          <app-button-spinner 
            type="button" 
            [loading]="loading()" 
            [disabled]="!selectedTenantId()"
            (click)="onSubmit()">
            Continue
          </app-button-spinner>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-card {
      width: 100%;
      max-width: 480px;
      background-color: var(--color-surface);
      border-radius: var(--radius-lg);
      padding: var(--spacing-8);
      box-shadow: var(--shadow-md);
      border: 1px solid var(--color-border);
    }
    .login-header {
      text-align: center;
      margin-bottom: var(--spacing-6);
    }
    .brand-logo {
      color: var(--color-primary);
      margin-bottom: var(--spacing-4);
    }
    .brand-logo span {
      color: var(--color-text-secondary);
      font-weight: 400;
    }
    .login-header h2 {
      margin-bottom: var(--spacing-2);
    }
    .login-header p {
      color: var(--color-text-secondary);
      font-size: var(--body-size);
      margin: 0;
    }
    .tenant-selection-container {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-6);
    }
    .search-box {
      width: 100%;
    }
    .search-input {
      width: 100%;
      padding: 12px var(--spacing-4);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 14px;
      outline: none;
      transition: all 0.2s ease;
      background-color: var(--color-background);
    }
    .search-input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-light);
      background-color: var(--color-surface);
    }
    .tenants-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3);
      max-height: 300px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .tenants-list::-webkit-scrollbar {
      width: 6px;
    }
    .tenants-list::-webkit-scrollbar-track {
      background: var(--color-background);
      border-radius: 4px;
    }
    .tenants-list::-webkit-scrollbar-thumb {
      background: var(--color-border-hover);
      border-radius: 4px;
    }
    .no-results {
      text-align: center;
      padding: var(--spacing-6);
      color: var(--color-text-secondary);
      font-size: 14px;
      background-color: var(--color-background);
      border-radius: var(--radius-md);
      border: 1px dashed var(--color-border);
    }
    .error-message {
      color: var(--color-danger);
      background-color: var(--color-danger-bg);
      padding: var(--spacing-3);
      border-radius: var(--radius-md);
      font-size: 14px;
      text-align: center;
      margin-bottom: var(--spacing-2);
    }
    .action-buttons {
      display: flex;
      gap: var(--spacing-4);
      margin-top: var(--spacing-2);
    }
    .btn-primary, .btn-secondary {
      border-radius: var(--radius-md);
      padding: 12px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
      flex: 1;
      text-align: center;
    }
    .btn-primary {
      background-color: var(--color-primary);
      color: white;
      border: none;
    }
    .btn-primary:hover:not(:disabled) {
      background-color: var(--color-primary-dark);
    }
    .btn-primary:disabled {
      background-color: var(--color-border-hover);
      cursor: not-allowed;
    }
    .btn-secondary {
      background-color: transparent;
      color: var(--color-text-primary);
      border: 1px solid var(--color-border);
    }
    .btn-secondary:hover:not(:disabled) {
      background-color: var(--color-surface-hover);
    }
  `]
})
export class SelectTenantComponent implements OnInit {
  private tenantSelectionFacade = inject(TenantSelectionFacade);
  private authFlowStore = inject(AuthFlowStore);

  readonly loading = this.authFlowStore.loading;
  readonly error = this.authFlowStore.error;
  readonly tenants = this.authFlowStore.tenants;
  readonly selectedTenantId = this.authFlowStore.selectedTenantId;

  searchQuery = '';

  constructor() {}

  ngOnInit(): void {
    this.tenantSelectionFacade.getAvailableTenants();
  }

  filteredTenants(): AvailableTenant[] {
    const q = this.searchQuery.toLowerCase();
    if (!q) return this.tenants();
    return this.tenants().filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.code.toLowerCase().includes(q)
    );
  }

  onSelect(id: string): void {
    this.authFlowStore.setSelectedTenantId(id);
  }

  onSubmit(): void {
    const id = this.selectedTenantId();
    if (!id) return;
    this.tenantSelectionFacade.selectTenant(id);
  }

  goBack(): void {
    // Navigate back via facade or router, selection logic is in Facade.
    // For now we can dispatch a clear action to facade
    // but the component can just trigger a router navigate.
    const router = inject(Router);
    router.navigate(['/auth/login']);
  }
}
