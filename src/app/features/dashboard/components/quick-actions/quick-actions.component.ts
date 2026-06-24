import {
  Component,
  ChangeDetectionStrategy,
  input,
} from '@angular/core';
import { RouterModule } from '@angular/router';

export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  route?: string;
  color: 'primary' | 'success' | 'warning' | 'info' | 'danger';
}

/**
 * Quick Actions Panel — Dumb/Presentational.
 * Grid of icon+label action buttons.
 */
@Component({
  selector: 'app-quick-actions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule],
  template: `
    <article class="qa-card" aria-label="Quick Actions">
      <div class="qa-card__header">
        <h2 class="qa-card__title">Quick Actions</h2>
      </div>

      <div class="qa-card__grid">
        @for (action of actions(); track action.id) {
          <button
            [id]="'qa-' + action.id"
            class="qa-action"
            [class]="'qa-action--' + action.color"
            type="button"
            [attr.aria-label]="action.label"
          >
            <span class="sym qa-action__icon">{{ action.icon }}</span>
            <span class="qa-action__label">{{ action.label }}</span>
          </button>
        }
      </div>
    </article>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .qa-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-1);
      padding: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
      height: 100%;
    }

    .qa-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .qa-card__title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    /* ── Grid ── */
    .qa-card__grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-3);
    }

    .qa-action {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      height: 80px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-background);
      cursor: pointer;
      transition:
        background var(--transition-fast),
        border-color var(--transition-fast),
        box-shadow var(--transition-fast),
        transform var(--transition-fast);
      padding: var(--space-3);

      &:hover {
        box-shadow: var(--shadow-2);
        transform: translateY(-2px);
      }

      &--primary:hover {
        background: var(--color-primary-light);
        border-color: var(--color-primary);
        .qa-action__icon { color: var(--color-primary-dark); }
      }

      &--success:hover {
        background: var(--color-success-bg);
        border-color: var(--color-success);
        .qa-action__icon { color: var(--color-success); }
      }

      &--warning:hover {
        background: var(--color-warning-bg);
        border-color: var(--color-warning);
        .qa-action__icon { color: var(--color-warning); }
      }

      &--info:hover {
        background: var(--color-info-bg);
        border-color: var(--color-info);
        .qa-action__icon { color: var(--color-info); }
      }

      &--danger:hover {
        background: var(--color-danger-bg);
        border-color: var(--color-danger);
        .qa-action__icon { color: var(--color-danger); }
      }
    }

    .qa-action__icon {
      font-size: 24px;
      color: var(--color-text-secondary);
      font-variation-settings: 'FILL' 0;
      transition: color var(--transition-fast);
    }

    .qa-action__label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
      text-align: center;
      line-height: var(--line-height-snug);
    }
  `],
})
export class QuickActionsComponent {
  readonly actions = input<QuickAction[]>([]);
}
