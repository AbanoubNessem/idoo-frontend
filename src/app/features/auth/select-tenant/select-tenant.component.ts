import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TenantSelectionFacade } from '../../../core/auth/facades/tenant-selection.facade';
import { AuthStateService } from '../../../core/auth/state/auth.state';
import { SelectionTokenStorageService } from '../../../core/auth/services/selection-token-storage.service';
import { AvailableTenant } from '../../../core/api/models';

@Component({
  selector: 'app-select-tenant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-card">
      <div class="login-header">
        <h1 class="brand-logo">iDoo <span>ERP</span></h1>
        <h2>Select Tenant</h2>
        <p>You have access to multiple workspaces</p>
      </div>

      <div class="tenant-selection-form">
        <div class="form-group">
          <label for="tenantSelect">Choose your workspace</label>
          <select id="tenantSelect" [(ngModel)]="selectedTenantId" class="tenant-select" [disabled]="isLoading()">
            <option value="" disabled selected>Select a tenant...</option>
            <option *ngFor="let tenant of availableTenants" [value]="tenant.id">
              {{ tenant.name }} ({{ tenant.code }})
            </option>
          </select>
        </div>

        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div class="action-buttons">
          <button type="button" class="btn-secondary" (click)="goBack()" [disabled]="isLoading()">Cancel</button>
          <button type="button" class="btn-primary" [disabled]="!selectedTenantId || isLoading()" (click)="onSelectTenant()">
            {{ isLoading() ? 'Loading...' : 'Proceed' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-card {
      background-color: var(--color-background);
      border-radius: var(--radius-lg);
      padding: var(--spacing-8);
      box-shadow: var(--shadow-2);
      border: 1px solid var(--color-border);
      width: 100%;
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
    .tenant-selection-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-4);
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2);
    }
    .form-group label {
      font-weight: 500;
      font-size: 14px;
      color: var(--color-text-primary);
    }
    .tenant-select {
      padding: 10px var(--spacing-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      width: 100%;
      background-color: var(--color-background);
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748B%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
      background-repeat: no-repeat;
      background-position: right 12px top 50%;
      background-size: 12px auto;
    }
    .tenant-select:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-light);
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
  private authState = inject(AuthStateService);
  private selectionTokenStorage = inject(SelectionTokenStorageService);
  private router = inject(Router);

  readonly isLoading = this.authState.isLoading;
  errorMessage = '';
  availableTenants: AvailableTenant[] = [];
  selectedTenantId = '';

  constructor() {}

  ngOnInit(): void {
    const token = this.selectionTokenStorage.getSelectionToken();
    if (!token) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.fetchTenants();
  }

  fetchTenants(): void {
    this.errorMessage = '';

    this.tenantSelectionFacade.getAvailableTenants().subscribe({
      next: (tenants) => {
        this.availableTenants = tenants || [];
        if (this.availableTenants.length === 0) {
          this.errorMessage = 'No workspaces available.';
        }
      },
      error: () => {
        this.errorMessage = 'Could not load available tenants.';
      }
    });
  }

  onSelectTenant(): void {
    if (!this.selectedTenantId) return;

    this.errorMessage = '';

    this.tenantSelectionFacade.selectTenant(this.selectedTenantId).subscribe({
      next: () => {},
      error: (err) => {
        this.errorMessage = err.error?.message || 'Tenant selection failed. Please try again.';
      }
    });
  }

  goBack(): void {
    this.selectionTokenStorage.clearSelectionToken();
    this.router.navigate(['/auth/login']);
  }
}
