// ============================================================
// Tenant Status Chip – Reusable, theme-token-based
// ============================================================

import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantStatus } from '../../enums/tenant.enums';

interface ChipConfig {
  label:    string;
  cssClass: string;
}

const STATUS_CONFIG: Record<TenantStatus, ChipConfig> = {
  [TenantStatus.ACTIVE]:    { label: 'Active',    cssClass: 'chip--active' },
  [TenantStatus.INACTIVE]:  { label: 'Inactive',  cssClass: 'chip--inactive' },
  [TenantStatus.TRIAL]:     { label: 'Trial',     cssClass: 'chip--trial' },
  [TenantStatus.SUSPENDED]: { label: 'Suspended', cssClass: 'chip--suspended' },
};

@Component({
  selector: 'tenant-status-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <span class="status-chip" [ngClass]="config().cssClass" [attr.aria-label]="'Status: ' + config().label">
      <span class="status-dot"></span>
      {{ config().label }}
    </span>
  `,
  styles: [`
    :host { display: inline-flex; }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: 3px var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      letter-spacing: 0.02em;
      white-space: nowrap;
      transition: opacity var(--transition-fast);
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      flex-shrink: 0;
    }

    .chip--active {
      color: var(--color-success);
      background: var(--color-success-bg);
      border: 1px solid var(--color-success-border);
    }

    .chip--inactive {
      color: var(--color-text-secondary);
      background: #F3F4F6;
      border: 1px solid var(--color-border);
    }

    .chip--trial {
      color: var(--color-warning);
      background: var(--color-warning-bg);
      border: 1px solid var(--color-warning-border);
    }

    .chip--suspended {
      color: var(--color-danger);
      background: var(--color-danger-bg);
      border: 1px solid var(--color-danger-border);
    }
  `],
})
export class TenantStatusChipComponent {
  readonly status = input.required<TenantStatus>();

  readonly config = computed<ChipConfig>(() =>
    STATUS_CONFIG[this.status()] ?? { label: this.status(), cssClass: 'chip--inactive' }
  );
}
