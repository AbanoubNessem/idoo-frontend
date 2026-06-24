import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnInit,
} from '@angular/core';

type Period = '6M' | '1Y' | 'YTD' | 'ALL';

interface RevenuePoint {
  month: string;
  value: number;
}

const DATA_6M: RevenuePoint[] = [
  { month: 'Jan', value: 420000 },
  { month: 'Feb', value: 380000 },
  { month: 'Mar', value: 510000 },
  { month: 'Apr', value: 470000 },
  { month: 'May', value: 620000 },
  { month: 'Jun', value: 590000 },
];

const DATA_1Y: RevenuePoint[] = [
  { month: 'Jul', value: 290000 },
  { month: 'Aug', value: 310000 },
  { month: 'Sep', value: 350000 },
  { month: 'Oct', value: 420000 },
  { month: 'Nov', value: 390000 },
  { month: 'Dec', value: 460000 },
  ...DATA_6M,
];

const DATA_YTD: RevenuePoint[] = DATA_6M;

const DATA_ALL: RevenuePoint[] = [
  { month: 'Q1\'24', value: 210000 },
  { month: 'Q2\'24', value: 280000 },
  { month: 'Q3\'24', value: 340000 },
  { month: 'Q4\'24', value: 460000 },
  { month: 'Q1\'25', value: 390000 },
  { month: 'Q2\'25', value: 510000 },
  { month: 'Q3\'25', value: 580000 },
  { month: 'Q4\'25', value: 640000 },
  { month: 'H1\'26', value: 590000 },
];

const DATASETS: Record<Period, RevenuePoint[]> = {
  '6M': DATA_6M,
  '1Y': DATA_1Y,
  YTD: DATA_YTD,
  ALL: DATA_ALL,
};

/**
 * Revenue Overview Chart — Pure SVG line chart (no external lib).
 * Dumb component — no injected services.
 */
@Component({
  selector: 'app-revenue-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="chart-card" aria-label="Revenue Overview">
      <!-- ── Header ── -->
      <div class="chart-card__header">
        <div class="chart-card__title-group">
          <h2 class="chart-card__title">Revenue Overview</h2>
          <span class="chart-card__subtitle">Monthly performance</span>
        </div>

        <div class="chart-card__periods" role="group" aria-label="Select period">
          @for (p of periods; track p) {
            <button
              [id]="'chart-period-' + p"
              class="chart-card__period-btn"
              [class.chart-card__period-btn--active]="activePeriod() === p"
              type="button"
              (click)="setPeriod(p)"
            >{{ p }}</button>
          }
        </div>
      </div>

      <!-- ── Summary Row ── -->
      <div class="chart-card__summary">
        <div class="chart-card__metric">
          <span class="chart-card__metric-label">Total Revenue</span>
          <span class="chart-card__metric-value">{{ totalFormatted() }}</span>
          <span class="chart-card__metric-badge chart-card__metric-badge--up">
            <span class="sym">trending_up</span> +12.4%
          </span>
        </div>
        <div class="chart-card__metric">
          <span class="chart-card__metric-label">Avg / Month</span>
          <span class="chart-card__metric-value">{{ avgFormatted() }}</span>
        </div>
        <div class="chart-card__metric">
          <span class="chart-card__metric-label">Peak Month</span>
          <span class="chart-card__metric-value">{{ peakMonth() }}</span>
        </div>
      </div>

      <!-- ── SVG Chart ── -->
      <div class="chart-card__plot" aria-hidden="true">
        <svg
          [attr.viewBox]="'0 0 ' + svgW + ' ' + svgH"
          preserveAspectRatio="none"
          class="chart-svg"
        >
          <defs>
            <linearGradient id="revenue-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stop-color="#0F62FE" stop-opacity="0.18"/>
              <stop offset="100%" stop-color="#0F62FE" stop-opacity="0"/>
            </linearGradient>
          </defs>

          <!-- Grid lines -->
          @for (g of gridLines(); track g.y) {
            <line
              [attr.x1]="padL" [attr.y1]="g.y"
              [attr.x2]="svgW - padR" [attr.y2]="g.y"
              class="chart-svg__grid"
            />
          }

          <!-- Area fill -->
          <path [attr.d]="areaPath()" class="chart-svg__area"/>

          <!-- Line -->
          <path [attr.d]="linePath()" class="chart-svg__line"/>

          <!-- Dots -->
          @for (pt of plotPoints(); track pt.x) {
            <circle
              [attr.cx]="pt.x" [attr.cy]="pt.y"
              r="4"
              class="chart-svg__dot"
            />
          }

          <!-- X-axis labels -->
          @for (pt of plotPoints(); track pt.x) {
            <text
              [attr.x]="pt.x" [attr.y]="svgH - 2"
              class="chart-svg__label"
              text-anchor="middle"
            >{{ pt.label }}</text>
          }

          <!-- Y-axis labels -->
          @for (g of gridLines(); track g.y) {
            <text
              [attr.x]="padL - 6" [attr.y]="g.y + 4"
              class="chart-svg__label chart-svg__label--y"
              text-anchor="end"
            >{{ g.label }}</text>
          }
        </svg>
      </div>
    </article>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .chart-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-1);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-6);
      height: 100%;
    }

    /* ── Header ── */
    .chart-card__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-4);
    }

    .chart-card__title-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .chart-card__title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .chart-card__subtitle {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .chart-card__periods {
      display: flex;
      gap: var(--space-1);
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 3px;
    }

    .chart-card__period-btn {
      height: 28px;
      padding: 0 var(--space-3);
      border: none;
      border-radius: calc(var(--radius-sm) - 2px);
      background: transparent;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: background var(--transition-fast), color var(--transition-fast);

      &--active {
        background: var(--color-surface);
        color: var(--color-primary);
        font-weight: var(--font-weight-semibold);
        box-shadow: var(--shadow-1);
      }
    }

    /* ── Summary ── */
    .chart-card__summary {
      display: flex;
      gap: var(--space-8);
    }

    .chart-card__metric {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .chart-card__metric-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .chart-card__metric-value {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      letter-spacing: -0.3px;
    }

    .chart-card__metric-badge {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      border-radius: var(--radius-badge);
      padding: 2px 6px;

      &--up {
        color: var(--color-success);
        background: var(--color-success-bg);
      }
      &--down {
        color: var(--color-danger);
        background: var(--color-danger-bg);
      }

      .sym { font-size: 13px; }
    }

    /* ── Plot ── */
    .chart-card__plot {
      flex: 1;
      min-height: 180px;
    }

    .chart-svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    .chart-svg__grid {
      stroke: var(--color-chart-grid);
      stroke-width: 1;
    }

    .chart-svg__area {
      fill: url(#revenue-gradient);
    }

    .chart-svg__line {
      fill: none;
      stroke: var(--color-primary);
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .chart-svg__dot {
      fill: var(--color-surface);
      stroke: var(--color-primary);
      stroke-width: 2;
    }

    .chart-svg__label {
      font-size: 10px;
      fill: var(--color-text-tertiary);
      font-family: var(--font-family);

      &--y { font-size: 9px; }
    }
  `],
})
export class RevenueChartComponent implements OnInit {
  readonly periods: Period[] = ['6M', '1Y', 'YTD', 'ALL'];
  readonly activePeriod = signal<Period>('6M');

  readonly svgW = 900;
  readonly svgH = 220;
  readonly padL = 52;
  readonly padR = 12;
  readonly padT = 16;
  readonly padB = 24;

  readonly data = computed(() => DATASETS[this.activePeriod()]);

  readonly totalFormatted = computed(() => {
    const total = this.data().reduce((s, d) => s + d.value, 0);
    return this.fmtCurrency(total);
  });

  readonly avgFormatted = computed(() => {
    const d = this.data();
    return this.fmtCurrency(d.reduce((s, x) => s + x.value, 0) / d.length);
  });

  readonly peakMonth = computed(() => {
    const d = this.data();
    const peak = d.reduce((a, b) => (b.value > a.value ? b : a));
    return peak.month;
  });

  readonly plotPoints = computed(() => {
    const d = this.data();
    const max = Math.max(...d.map(x => x.value));
    const min = Math.min(...d.map(x => x.value));
    const range = max - min || 1;
    const w = this.svgW - this.padL - this.padR;
    const h = this.svgH - this.padT - this.padB;
    const step = w / Math.max(d.length - 1, 1);

    return d.map((pt, i) => ({
      x: this.padL + i * step,
      y: this.padT + h - ((pt.value - min) / range) * h,
      label: pt.month,
      value: pt.value,
    }));
  });

  readonly linePath = computed(() => {
    const pts = this.plotPoints();
    if (!pts.length) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  });

  readonly areaPath = computed(() => {
    const pts = this.plotPoints();
    if (!pts.length) return '';
    const base = this.svgH - this.padB;
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${line} L${last.x},${base} L${first.x},${base} Z`;
  });

  readonly gridLines = computed(() => {
    const d = this.data();
    const max = Math.max(...d.map(x => x.value));
    const h = this.svgH - this.padT - this.padB;
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const fraction = i / steps;
      const y = this.padT + h * (1 - fraction);
      const val = max * fraction;
      return { y, label: this.fmtK(val) };
    });
  });

  ngOnInit(): void {}

  setPeriod(p: Period): void {
    this.activePeriod.set(p);
  }

  private fmtCurrency(v: number): string {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toLocaleString()}`;
  }

  private fmtK(v: number): string {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return `${v}`;
  }
}
