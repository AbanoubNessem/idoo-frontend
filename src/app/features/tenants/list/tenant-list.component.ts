// ============================================================
// Tenant List Page Component
// ============================================================

import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantFacade } from '../facades/tenant.facade';
import { TenantStore } from '../store/tenant.store';
import { TenantService } from '../services/tenant.service';

import { TenantHeaderComponent } from '../components/tenant-header/tenant-header.component';
import { TenantStatCardComponent } from '../components/tenant-stat-card/tenant-stat-card.component';
import { TenantToolbarComponent } from '../components/tenant-toolbar/tenant-toolbar.component';
import { TenantTableComponent } from '../components/tenant-table/tenant-table.component';
import { TenantDetailsPanelComponent } from '../components/tenant-details-panel/tenant-details-panel.component';
import { TenantPaginationComponent } from '../components/tenant-pagination/tenant-pagination.component';
import { TenantLoadingComponent } from '../components/tenant-loading/tenant-loading.component';
import { TenantEmptyStateComponent } from '../components/tenant-empty-state/tenant-empty-state.component';
import { TenantStatCard, TenantListItem } from '../models/tenant.models';
import { TenantStatus } from '../enums/tenant.enums';

@Component({
  selector: 'app-tenant-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TenantStore, TenantService, TenantFacade],
  imports: [
    CommonModule,
    TenantHeaderComponent,
    TenantStatCardComponent,
    TenantToolbarComponent,
    TenantTableComponent,
    TenantDetailsPanelComponent,
    TenantPaginationComponent,
    TenantLoadingComponent,
    TenantEmptyStateComponent
  ],
  template: `
    <div class="page-container">
      <tenant-header 
        (refresh)="facade.refresh()" 
        (create)="onCreate()" 
        (export)="onExport()" 
      />

      <div class="stats-grid">
        @if (facade.loading() && facade.isEmpty()) {
           <tenant-loading type="cards" />
        } @else if (facade.statistics()) {
           <tenant-stat-card 
             [data]="{
               id: 'total', title: 'Total Tenants', count: facade.statistics()!.totalTenants,
               description: 'All tenants', icon: 'business', colorVar: '--color-primary',
               trendData: facade.statistics()!.totalTrendData, trendColor: '--color-primary'
             }"
           />
           <tenant-stat-card 
             [data]="{
               id: 'active', title: 'Active Tenants', count: facade.statistics()!.activeTenants,
               description: activePercent + '% of total', icon: 'check_circle', colorVar: '--color-success',
               trendData: facade.statistics()!.activeTrendData, trendColor: '--color-success'
             }"
           />
           <tenant-stat-card 
             [data]="{
               id: 'trial', title: 'Trial Tenants', count: facade.statistics()!.trialTenants,
               description: trialPercent + '% of total', icon: 'schedule', colorVar: '--color-warning',
               trendData: facade.statistics()!.trialTrendData, trendColor: '--color-warning'
             }"
           />
           <tenant-stat-card 
             [data]="{
               id: 'suspended', title: 'Suspended Tenants', count: facade.statistics()!.suspendedTenants,
               description: suspendedPercent + '% of total', icon: 'pause_circle', colorVar: '--color-danger',
               trendData: facade.statistics()!.suspendedTrendData, trendColor: '--color-danger'
             }"
           />
        }
      </div>

      <tenant-toolbar 
        (searchChange)="facade.setSearch($event)"
        (filtersChange)="facade.setFilters($event)"
      />

      <div class="content-layout" [class.has-selection]="!!facade.selectedTenant()">
        <div class="main-content">
           @if (facade.loading() && facade.isEmpty()) {
             <tenant-loading type="table" />
           } @else if (facade.isEmpty()) {
             <tenant-empty-state (create)="onCreate()" />
           } @else {
             <tenant-table 
               [tenants]="facade.tenants()"
               [selectedTenantId]="facade.selectedTenant()?.id || null"
               (rowClick)="onRowClick($event)"
               (view)="onRowClick($event)"
               (edit)="onEdit($event)"
               (delete)="onDelete($event)"
               (activate)="onActivate($event)"
               (deactivate)="onDeactivate($event)"
               (switchContext)="onSwitchContext($event)"
             />
             <tenant-pagination 
               [currentPage]="facade.currentPage()"
               [totalPages]="facade.totalPages()"
               [totalElements]="facade.pagination().totalElements"
               [pageSize]="facade.pageSize()"
               [isFirstPage]="facade.isFirstPage()"
               [isLastPage]="facade.isLastPage()"
               (pageChange)="facade.goToPage($event)"
               (pageSizeChange)="facade.setPageSize($event)"
             />
           }
        </div>
        
        @if (facade.selectedTenant() || facade.loadingDetail()) {
          <div class="side-panel">
            @if (facade.loadingDetail()) {
               <tenant-loading type="detail" />
            } @else {
               <tenant-details-panel 
                 [tenant]="facade.selectedTenant()"
                 (close)="facade.deselectTenant()"
                 (edit)="onEdit($event)"
                 (switchContext)="onSwitchContext($event)"
               />
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: var(--space-6);
      max-width: var(--content-max-width);
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      height: 100%;
      box-sizing: border-box;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .content-layout {
      display: flex;
      gap: var(--space-4);
      flex: 1;
      min-height: 0;
      transition: all var(--transition-layout);
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      transition: all var(--transition-layout);
    }

    .side-panel {
      width: 400px;
      flex-shrink: 0;
      transition: all var(--transition-layout);
    }

    @media (max-width: 1024px) {
      .has-selection .main-content {
        display: none;
      }
      .side-panel {
        width: 100%;
      }
    }
  `],
})
export class TenantListComponent implements OnInit {
  readonly facade = inject(TenantFacade);

  ngOnInit(): void {
    this.facade.init();
  }

  get activePercent(): string { return this.calcPercent(this.facade.statistics()?.activeTenants); }
  get trialPercent(): string { return this.calcPercent(this.facade.statistics()?.trialTenants); }
  get suspendedPercent(): string { return this.calcPercent(this.facade.statistics()?.suspendedTenants); }

  private calcPercent(val?: number): string {
    const total = this.facade.statistics()?.totalTenants || 1;
    return (((val || 0) / total) * 100).toFixed(1);
  }

  onCreate(): void {
    // Open create dialog
    console.log('Open Create Dialog');
  }

  onExport(): void {
    console.log('Exporting...');
  }

  onRowClick(tenant: TenantListItem): void {
    this.facade.selectTenant(tenant.id);
  }

  onEdit(tenant: any): void {
    console.log('Edit tenant:', tenant);
  }

  onDelete(tenant: TenantListItem): void {
    console.log('======== TENANTS ========');
    console.log('Tenant Deleted:', tenant);
    // this.facade.deleteTenant(tenant.id); // Add confirm dialog in future
  }

  onActivate(tenant: TenantListItem): void {
    console.log('======== TENANTS ========');
    console.log('Tenant Activated:', tenant);
    this.facade.activateTenant(tenant.id);
  }

  onDeactivate(tenant: TenantListItem): void {
    console.log('======== TENANTS ========');
    console.log('Tenant Deactivated:', tenant);
    this.facade.deactivateTenant(tenant.id);
  }
  
  onSwitchContext(tenant: any): void {
    console.log('======== TENANTS ========');
    console.log('Switch context to:', tenant);
  }
}
