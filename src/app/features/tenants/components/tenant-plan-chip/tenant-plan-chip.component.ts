// ============================================================
// Tenant Plan Chip – Reusable, token-based
// ============================================================

import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionPlan } from '../../enums/tenant.enums';

interface PlanConfig {
  label:    string;
  cssClass: string;
}

const PLAN_CONFIG: Record<SubscriptionPlan, PlanConfig> = {
  [SubscriptionPlan.ENTERPRISE]:   { label: 'Enterprise',   cssClass: 'plan--enterprise' },
  [SubscriptionPlan.PROFESSIONAL]: { label: 'Professional', cssClass: 'plan--professional' },
  [SubscriptionPlan.STANDARD]:     { label: 'Standard',     cssClass: 'plan--standard' },
  [SubscriptionPlan.TRIAL]:        { label: 'Trial',        cssClass: 'plan--trial' },
};

@Component({
  selector: 'tenant-plan-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <span class="plan-chip" [ngClass]="config().cssClass" [attr.aria-label]="'Plan: ' + config().label">
      {{ config().label }}
    </span>
  `,
  styles: [`
    :host { display: inline-flex; }

    .plan-chip {
      display: inline-flex;
      align-items: center;
      padding: 3px var(--space-2);
      border-radius: var(--radius-badge);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      white-space: nowrap;
      letter-spacing: 0.02em;
    }

    .plan--enterprise {
      color: #7C3AED;
      background: #F5F3FF;
      border: 1px solid #DDD6FE;
    }

    .plan--professional {
      color: var(--color-primary);
      background: var(--color-primary-light);
      border: 1px solid #BFDBFE;
    }

    .plan--standard {
      color: var(--color-warning);
      background: var(--color-warning-bg);
      border: 1px solid var(--color-warning-border);
    }

    .plan--trial {
      color: var(--color-success);
      background: var(--color-success-bg);
      border: 1px solid var(--color-success-border);
    }
  `],
})
export class TenantPlanChipComponent {
  readonly plan = input.required<SubscriptionPlan>();

  readonly config = computed<PlanConfig>(() =>
    PLAN_CONFIG[this.plan()] ?? { label: this.plan(), cssClass: 'plan--standard' }
  );
}
