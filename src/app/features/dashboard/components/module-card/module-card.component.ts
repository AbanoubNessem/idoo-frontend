import {
  Component,
  ChangeDetectionStrategy,
  input,
} from '@angular/core';
import { RouterModule } from '@angular/router';

export interface ModuleCard {
  id: string;
  icon: string;
  shortName: string;
  fullName: string;
  description: string;
  route: string;
  color: 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'purple';
  enabled: boolean;
}

/**
 * Module Card — Dumb/Presentational.
 * Single ERP module tile with icon, title, description, hover lift.
 */
@Component({
  selector: 'app-module-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule],
  template: `
    <a
      class="module"
      [class]="'module--' + card().color"
      [class.module--disabled]="!card().enabled"
      [id]="'module-' + card().id"
      [routerLink]="card().enabled ? card().route : null"
      role="link"
      [attr.aria-disabled]="!card().enabled"
      [attr.aria-label]="card().fullName"
    >
      <div class="module__icon-wrap">
        <span class="sym module__icon">{{ card().icon }}</span>
      </div>
      <div class="module__body">
        <span class="module__short">{{ card().shortName }}</span>
        <span class="module__full">{{ card().fullName }}</span>
        <span class="module__desc">{{ card().description }}</span>
      </div>
      @if (card().enabled) {
        <span class="sym module__arrow">arrow_forward</span>
      } @else {
        <span class="module__soon">Soon</span>
      }
    </a>
  `,
  styles: [`
    :host { display: block; }

    .module {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-5);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-1);
      cursor: pointer;
      text-decoration: none;
      transition:
        box-shadow var(--transition-base),
        transform var(--transition-base),
        border-color var(--transition-fast);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: currentColor;
        opacity: 0;
        transition: opacity var(--transition-fast);
      }

      &:hover:not(.module--disabled) {
        box-shadow: var(--shadow-3);
        transform: translateY(-3px);
        border-color: currentColor;

        &::before { opacity: 1; }

        .module__arrow {
          opacity: 1;
          transform: translateX(0);
        }
      }

      &--disabled {
        opacity: 0.55;
        cursor: default;
      }
    }

    /* ── Color variants ── */
    .module--primary { color: var(--color-primary); }
    .module--success { color: var(--color-success); }
    .module--warning { color: var(--color-warning); }
    .module--info    { color: var(--color-info); }
    .module--danger  { color: var(--color-danger); }
    .module--purple  { color: #7C3AED; }

    /* ── Icon ── */
    .module__icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: currentColor;
      opacity: 1;
    }

    .module__icon-wrap {
      background: transparent;
      border: 1.5px solid currentColor;
    }

    .module__icon {
      font-size: 24px;
      color: currentColor;
      font-variation-settings: 'FILL' 0;
    }

    /* ── Body ── */
    .module__body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .module__short {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      color: currentColor;
      letter-spacing: 0.3px;
    }

    .module__full {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .module__desc {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Arrow ── */
    .module__arrow {
      font-size: 18px;
      color: var(--color-text-tertiary);
      opacity: 0;
      transform: translateX(-4px);
      transition:
        opacity var(--transition-base),
        transform var(--transition-base);
      flex-shrink: 0;
    }

    /* ── Soon badge ── */
    .module__soon {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-badge);
      padding: 2px 8px;
      color: var(--color-text-tertiary);
      flex-shrink: 0;
    }
  `],
})
export class ModuleCardComponent {
  readonly card = input.required<ModuleCard>();
}
