import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { DatePipe } from '@angular/common';

/**
 * Welcome Section — Dumb/Presentational
 * Shows greeting (time-aware) + user name + current date.
 */
@Component({
  selector: 'app-welcome-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <section class="welcome" aria-label="Welcome section">
      <div class="welcome__left">
        <h1 class="welcome__greeting">
          {{ greeting() }}, {{ userName() }} 👋
        </h1>
        <p class="welcome__subtitle">Welcome back to iDoo ERP</p>
      </div>

      <div class="welcome__right">
        <span class="sym welcome__cal-icon">calendar_today</span>
        <div class="welcome__date-block">
          <span class="welcome__date">{{ now | date:'EEEE, MMMM d, yyyy' }}</span>
          <span class="welcome__time">{{ currentTime() }}</span>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    .welcome {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-6) 0 var(--space-4);
    }

    /* ── Left ── */
    .welcome__left {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .welcome__greeting {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      line-height: var(--line-height-tight);
      letter-spacing: -0.4px;
    }

    .welcome__subtitle {
      font-size: var(--font-size-base);
      color: var(--color-text-secondary);
      font-weight: var(--font-weight-normal);
    }

    /* ── Right ── */
    .welcome__right {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-3) var(--space-5);
      box-shadow: var(--shadow-1);
      flex-shrink: 0;
    }

    .welcome__cal-icon {
      font-size: 22px;
      color: var(--color-primary);
      font-variation-settings: 'FILL' 0;
    }

    .welcome__date-block {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .welcome__date {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      white-space: nowrap;
    }

    .welcome__time {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    /* ── Responsive ── */
    @media (max-width: 767px) {
      .welcome {
        flex-direction: column;
        align-items: flex-start;
        padding: var(--space-4) 0 var(--space-2);
        gap: var(--space-3);
      }

      .welcome__greeting { font-size: var(--font-size-xl); }
      .welcome__right { align-self: stretch; }
    }
  `],
})
export class WelcomeSectionComponent implements OnInit, OnDestroy {
  readonly userName = input<string>('Abanoub Girgis');

  now = new Date();
  readonly currentTime = signal(this.formatTime(new Date()));

  private _timer: ReturnType<typeof setInterval> | null = null;

  readonly greeting = computed(() => {
    const h = this.now.getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  });

  ngOnInit(): void {
    this._timer = setInterval(() => {
      this.now = new Date();
      this.currentTime.set(this.formatTime(this.now));
    }, 60_000);
  }

  ngOnDestroy(): void {
    if (this._timer) clearInterval(this._timer);
  }

  private formatTime(d: Date): string {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
}
