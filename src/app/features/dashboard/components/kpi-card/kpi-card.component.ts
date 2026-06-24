import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';

export type KpiTrend = 'up' | 'down' | 'neutral';

export interface KpiCardData {
  id: string;
  title: string;
  value: number | string;
  growth: string;
  growthDirection: KpiTrend;
  icon: string;
  iconColor: 'primary' | 'success' | 'warning' | 'info';
}

/**
 * Dumb / Presentational KPI Card.
 * Receives all data via inputs — no injected services.
 */
@Component({
  selector: 'app-kpi-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="kpi"
      [class]="'kpi--' + data().iconColor"
      [id]="'kpi-card-' + data().id"
      role="region"
      [attr.aria-label]="data().title + ': ' + data().value"
    >
      <div class="kpi__icon-wrap">
        <span class="sym kpi__icon">{{ data().icon }}</span>
      </div>

      <div class="kpi__body">
        <span class="kpi__title">{{ data().title }}</span>
        <span class="kpi__value">{{ formattedValue() }}</span>
        <div class="kpi__growth" [class]="'kpi__growth--' + data().growthDirection">
          <span class="sym kpi__growth-icon">
            {{ growthIcon() }}
          </span>
          <span class="kpi__growth-text">{{ data().growth }}</span>
        </div>
      </div>
    </article>
  `,
  styles: [`
    :host { display: block; }

    .kpi {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
      padding: var(--space-5) var(--space-6);
      display: flex;
      align-items: center;
      gap: var(--space-4);
      box-shadow: var(--shadow-1);
      transition: box-shadow var(--transition-base), transform var(--transition-base);
      cursor: default;

      &:hover {
        box-shadow: var(--shadow-2);
        transform: translateY(-1px);
      }
    }

    /* ── Icon ── */
    .kpi__icon-wrap {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi__icon {
      font-size: 24px;
      font-variation-settings: 'FILL' 1;
    }

    /* ── Color Variants ── */
    .kpi--primary .kpi__icon-wrap {
      background: var(--color-primary-light);
      .kpi__icon { color: var(--color-primary-dark); }
    }

    .kpi--success .kpi__icon-wrap {
      background: var(--color-success-bg);
      .kpi__icon { color: var(--color-success); }
    }

    .kpi--warning .kpi__icon-wrap {
      background: var(--color-warning-bg);
      .kpi__icon { color: var(--color-warning); }
    }

    .kpi--info .kpi__icon-wrap {
      background: var(--color-info-bg);
      .kpi__icon { color: var(--color-info); }
    }

    /* ── Body ── */
    .kpi__body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .kpi__title {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .kpi__value {
      font-size: var(--font-size-4xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      line-height: var(--line-height-tight);
      letter-spacing: -0.5px;
    }

    .kpi__growth {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);

      &--up    { color: var(--color-success); }
      &--down  { color: var(--color-danger); }
      &--neutral { color: var(--color-text-secondary); }
    }

    .kpi__growth-icon {
      font-size: 15px;
    }

    .kpi__growth-text {
      white-space: nowrap;
    }
  `],
})
export class KpiCardComponent {
  readonly data = input.required<KpiCardData>();

  readonly formattedValue = computed(() => {
    const v = this.data().value;
    if (typeof v === 'number') {
      return v.toLocaleString('en-US');
    }
    return v;
  });

  readonly growthIcon = computed(() => {
    const d = this.data().growthDirection;
    if (d === 'up') return 'trending_up';
    if (d === 'down') return 'trending_down';
    return 'trending_flat';
  });
}
