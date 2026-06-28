// ============================================================
// Tenant Stat Card – Reusable with SVG mini trend chart
// ============================================================

import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantStatCard } from '../../models/tenant.models';

const CHART_WIDTH  = 120;
const CHART_HEIGHT = 36;
const CHART_MARGIN = 4;

@Component({
  selector: 'tenant-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <article class="stat-card" [attr.aria-label]="data().title + ': ' + data().count">
      <div class="stat-card__top">
        <div class="stat-card__icon-wrap" [style.--card-color]="'var(' + data().colorVar + ')'">
          <span class="material-symbols-rounded stat-card__icon">{{ data().icon }}</span>
        </div>
        <div class="stat-card__info">
          <p class="stat-card__title">{{ data().title }}</p>
          <p class="stat-card__count">{{ data().count }}</p>
          <p class="stat-card__desc">{{ data().description }}</p>
        </div>
      </div>
      <div class="stat-card__chart" aria-hidden="true">
        <svg
          [attr.width]="chartWidth"
          [attr.height]="chartHeight"
          [attr.viewBox]="'0 0 ' + chartWidth + ' ' + chartHeight"
          preserveAspectRatio="none"
        >
          <polyline
            [attr.points]="sparklinePath()"
            fill="none"
            [attr.stroke]="'var(' + data().trendColor + ')'"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </article>
  `,
  styles: [`
    .stat-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
      padding: var(--space-5) var(--space-6);
      box-shadow: var(--shadow-1);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      cursor: default;
      transition:
        box-shadow var(--transition-base),
        transform var(--transition-base);

      &:hover {
        box-shadow: var(--shadow-3);
        transform: translateY(-2px);
      }
    }

    .stat-card__top {
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
    }

    .stat-card__icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--card-color) 12%, transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-card__icon {
      font-size: 24px;
      color: var(--card-color);
    }

    .stat-card__info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .stat-card__title {
      margin: 0;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
      white-space: nowrap;
    }

    .stat-card__count {
      margin: 0;
      font-size: var(--font-size-4xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      line-height: var(--line-height-tight);
    }

    .stat-card__desc {
      margin: 0;
      font-size: var(--font-size-xs);
      color: var(--color-text-tertiary);
    }

    .stat-card__chart {
      align-self: flex-end;
      display: flex;
      align-items: flex-end;
    }
  `],
})
export class TenantStatCardComponent {
  readonly data = input.required<TenantStatCard>();

  readonly chartWidth  = CHART_WIDTH;
  readonly chartHeight = CHART_HEIGHT;

  readonly sparklinePath = computed<string>(() => {
    const values = this.data().trendData;
    if (!values || values.length < 2) return '';

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const w = CHART_WIDTH  - CHART_MARGIN * 2;
    const h = CHART_HEIGHT - CHART_MARGIN * 2;

    return values
      .map((v, i) => {
        const x = CHART_MARGIN + (i / (values.length - 1)) * w;
        const y = CHART_MARGIN + h - ((v - min) / range) * h;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });
}
